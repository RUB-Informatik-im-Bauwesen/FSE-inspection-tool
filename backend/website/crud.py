# Backend
from fastapi import FastAPI, Depends
from fastapi_login import LoginManager
from fastapi.security import OAuth2PasswordRequestForm
from fastapi_login.exceptions import InvalidCredentialsException
from fastapi.middleware.cors import CORSMiddleware
from backend.website.db import collection_users, collection_annotations, collection_images, collection_projects, collection_rankings, collection_models
from backend.website.models import User, Project, Image, Model
from bson.objectid import ObjectId
from bson.errors import InvalidId
from fastapi import HTTPException
import backend.utils.model_utils

#Active Learning
import torch
import pandas as pd
import numpy as np

async def create_user(user):
    user = dict(user)
    document = await collection_users.find_one({"username": user["username"]})
    if document:
        raise HTTPException(status_code=409, detail="User already registered")
    document = await collection_users.find_one({"email": user["email"]})
    if document:
        raise HTTPException(status_code=409, detail="Email already registered")
    await collection_users.insert_one(user)


async def create_project(project, user):
  document = dict(project, **{"username": user["username"]})
  await collection_projects.insert_one(document)

async def update_project(id, name, description, user):
    try:
        document = await collection_projects.find_one({"_id": ObjectId(id)})
    except InvalidId:
        raise HTTPException(
            status_code=422, detail="Id not in the right format")
    if not document:
        raise HTTPException(status_code=404, detail="ID not found")
    if user["username"] != document["username"]:
        raise HTTPException(status_code=403, detail="Unauthorized")
    updated_project = await collection_projects.find_one_and_update({"_id": ObjectId(id)}, {"$set": {"name": name,"description":description}})
    return updated_project

async def delete_project(id, user):
    try:
        document = await collection_projects.find_one({"_id": ObjectId(id)})
    except InvalidId:
        raise HTTPException(
            status_code=422, detail="Id not in the right format")
    if not document:
        raise HTTPException(status_code=404, detail="ID not found")
    if user["username"] != document["username"]:
        raise HTTPException(status_code=403, detail="Unauthorized")
    document = await collection_projects.find_one_and_delete({"_id": ObjectId(id)})
    return document

async def fetch_projects_by_user(user):
    projects = []
    cursor = collection_projects.find({"username": user})
    async for document in cursor:
        project = Project(**document)
        projects.append(project)
    return projects

async def upload_image(image, user):
  document = dict(image, **{"username": user["username"]})
  check_same_image = await collection_images.find_one({"name" : document["name"]})
  check_same_project = await collection_images.find_one({"project_id" : document["project_id"]})
  if check_same_image and check_same_project:
      raise HTTPException(status_code=404, detail="Change Image name!")
  check_same_path = await collection_images.find_one({"name" : document["path"]})
  if check_same_path and check_same_project:
      raise HTTPException(status_code=404, detail="Same path as an other image!")
  await collection_images.insert_one(document)
  return document

async def update_image(id, image, user):
    doc = dict(image)
    try:
        document = await collection_images.find_one({"_id": ObjectId(id)})
    except InvalidId:
        raise HTTPException(
            status_code=422, detail="Id not in the right format")
    if not document:
        raise HTTPException(status_code=404, detail="ID not found")
    if user["username"] != document["username"]:
        raise HTTPException(status_code=403, detail="Unauthorized")
    updated_image = await collection_images.find_one_and_update({"_id": ObjectId(id)}, {"$set": {"name": doc["name"], "file_type": doc["file_type"], "date_uploaded":doc["date_uploaded"], "path":doc["path"]}})
    return updated_image

async def delete_image(id, user):
    try:
        document = await collection_images.find_one({"_id": ObjectId(id)})
    except InvalidId:
        raise HTTPException(
            status_code=422, detail="Id not in the right format")
    if not document:
        raise HTTPException(status_code=404, detail="ID not found")
    if user["username"] != document["username"]:
        raise HTTPException(status_code=403, detail="Unauthorized")
    document = await collection_images.find_one_and_delete({"_id": ObjectId(id)})
    return document

async def fetch_images_by_user(user):
    images = []
    cursor = collection_images.find({"username": user})
    async for document in cursor:
        image = Image(**document)
        images.append(image)
    return images

async def fetch_images_by_projects(id):
    images = []
    cursor = collection_images.find({"project_id": id})
    async for document in cursor:
        image = Image(**document)
        images.append(image)
    return images

async def upload_model(model, user):
  document = dict(model, **{"username": user["username"]})
  check_same_model = await collection_models.find_one({"name" : document["name"]})
  if check_same_model:
      raise HTTPException(status_code=404, detail="Change model name!")
  check_same_path = await collection_models.find_one({"path" : document["path"]})
  if check_same_path:
      raise HTTPException(status_code=404, detail="Same path as an other model!")
  await collection_models.insert_one(document)
  return document

async def update_model(id, model, user):
    doc = dict(model)
    try:
        document = await collection_models.find_one({"_id": ObjectId(id)})
    except InvalidId:
        raise HTTPException(
            status_code=422, detail="Id not in the right format")
    if not document:
        raise HTTPException(status_code=404, detail="ID not found")
    if user["username"] != document["username"]:
        raise HTTPException(status_code=403, detail="Unauthorized")
    updated_model = await collection_models.find_one_and_update({"_id": ObjectId(id)}, {"$set": {"name": doc["name"], "file_type": doc["file_type"], "date_uploaded":doc["date_uploaded"], "path":doc["path"]}})
    return updated_model

async def delete_model(id, user):
    try:
        document = await collection_models.find_one({"_id": ObjectId(id)})
    except InvalidId:
        raise HTTPException(
            status_code=422, detail="Id not in the right format")
    if not document:
        raise HTTPException(status_code=404, detail="ID not found")
    if user["username"] != document["username"]:
        raise HTTPException(status_code=403, detail="Unauthorized")
    document = await collection_models.find_one_and_delete({"_id": ObjectId(id)})
    return document

async def fetch_models_by_user(user):
    models = []
    cursor = collection_models.find({"username": user})
    async for document in cursor:
        model = Model(**document)
        models.append(model)
    return models

async def fetch_models_by_project(id):
    models = []
    cursor = collection_models.find({"project_id": id})
    async for document in cursor:
        model = Model(**document)
        models.append(model)
    return models

async def fetch_rankings_images_by_project(project_id):

    # Get image paths
    paths_to_images = []
    images = collection_images.find({"project_id": project_id})
    async for document in images:
        path = document["path"]
        paths_to_images.append(path)

    # Load the model
    models = []
    models_collection = collection_models.find({"project_id": project_id})
    if not models_collection:
        raise HTTPException(status_code=404, detail="No models found in the project.")
    async for document in models_collection:
        path = document["path"]
        model = torch.hub.load('ultralytics/yolov5', 'custom', path=path)
        models.append(model)

    rankings_list = []

    if (len(models) > 1):
      async for img in paths_to_images:
            results_list = []
            async for model in models:
                result = model(img)
                results_list.append(result)

            # Bounding Boxes, Scores, and Labels
            boxes_list = []
            scores_list = []
            labels_list = []


            async for results in results_list:

                # Extract DataFrame for first object detected
                df = results.pandas().xyxy[0]

                # Extract values for bounding boxes, scores, and labels
                bboxes = df[['xmin', 'ymin', 'xmax', 'ymax']].values.tolist()
                scores = df['confidence'].values.tolist()
                labels = df['class'].values.tolist()

                # Append values to respective lists
                boxes_list.append(bboxes)
                scores_list.append(scores)
                labels_list.append(labels)

            if any(not sublist for sublist in boxes_list):

                consensus_score = 1
                result = [results_list[0].pandas().xywhn[0], consensus_score, img]
                rankings_list.append(result)

                continue

            # Calculate IoU matrices for each combination of models
            iou_matrices = []
            for i in range(len(models)):
                for j in range(len(models)):
                    if i == j: #CHANGE FOR TESTING
                        continue
                    if i > j:
                        continue
                    iou_matrix = np.zeros((len(boxes_list[i]), len(boxes_list[j])))
                    for idx_i, boxes_i in enumerate(boxes_list[i]):
                        for idx_j, boxes_j in enumerate(boxes_list[j]):
                            iou_matrix[idx_i, idx_j] = backend.utils.iou(boxes_i, boxes_j)
                    iou_df = pd.DataFrame(iou_matrix, index=[f"Model {i} Box {idx_i}" for idx_i in range(len(boxes_list[i]))],
                                        columns=[f"Model {j} Box {idx_j}" for idx_j in range(len(boxes_list[j]))])
                    iou_matrices.append(iou_df)

            roi_matches, matches, min_matches = backend.utils.get_roi_matches(iou_matrices)

            #Get Classes for each min value in each iou_matrices
            test_min = []
            async for match in min_matches:
                min_match = backend.utils.merge_subarrays_match(match,matches.copy())
                test_min.append(min_match)

            class_matches = backend.utils.get_class_matches(test_min,labels_list)

            #Calculate Consensus Score
            variation_ratios = backend.utils.variation_ratio(class_matches)
            variation_ratios = [[ratio] async for ratio in variation_ratios]

            min_values = []
            async for entry in roi_matches:
                min_values.append(min(entry))

            #To numpy for multiplication
            min_values = np.array(min_values)
            variation_ratios = np.array(variation_ratios)

            consensus_score = 1 - np.mean(np.multiply(min_values,variation_ratios))

            result = [results_list[0].pandas().xywhn[0] ,consensus_score, img]

            rankings_list.append(result)

    if(len(models) == 1):
        # Uncertainty Score with only one model
        return {}

    # Sort the rankings list by the uncertainty score in descending order
    rankings_list.sort(key=lambda x: x[1], reverse=True)

    # Create a new list of lists with the image name and rank
    ranked_images = {}
    async for rank, item in enumerate(rankings_list, start=1):
        image_name = item[2].split("/")[-1]
        ranked_images[image_name] = rank

    updated_ranks = []
    async for img in images:
        updated_image = await collection_images.find_one_and_update({"_id": ObjectId(id)}, {"$set": {"ranking":ranked_images[img]}})
        updated_ranks.append(updated_image)

    return updated_ranks


