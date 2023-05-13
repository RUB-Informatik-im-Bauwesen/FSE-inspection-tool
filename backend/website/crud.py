# Backend
from fastapi import FastAPI, Depends
from fastapi_login import LoginManager
from fastapi.security import OAuth2PasswordRequestForm
from fastapi_login.exceptions import InvalidCredentialsException
from fastapi.middleware.cors import CORSMiddleware
from backend.website.db import collection_users, collection_annotations, collection_images, collection_projects, collection_rankings, collection_models
from backend.website.models import User, Project, Image, Model, Annotation
from bson.objectid import ObjectId
from bson.errors import InvalidId
from fastapi import HTTPException
from backend.utils.model_utils import iou, get_class_matches, get_roi_matches, merge_subarrays_match, variation_ratio
import os
import shutil
import random
import yaml

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
  check_name = await collection_projects.find_one({"name": document["name"]})
  if check_name:
      raise HTTPException(status_code=409, detail="Choose a different name!")
  # specify the path where you want to create the new folder
  path = "storage\\Projects"
  #cwd = os.getcwd()
  #path = os.path.join(cwd,path)
  # specify the name of the new folder
  folder_name = user["username"] + "_" + document["name"]
  path_print = os.path.join(path, folder_name)
  # check if the folder already exists
  if not os.path.exists(os.path.join(path, folder_name)):
    # create the new folder
    os.makedirs(os.path.join(path, folder_name))
    # create the images and labels folders inside the new folder
    os.makedirs(os.path.join(path, folder_name, "images"))
    os.makedirs(os.path.join(path, folder_name, "labels"))
    # create the train and val folders inside the images and labels folders
    os.makedirs(os.path.join(path, folder_name, "images", "train"))
    os.makedirs(os.path.join(path, folder_name, "images", "val"))
    os.makedirs(os.path.join(path, folder_name, "labels", "train"))
    os.makedirs(os.path.join(path, folder_name, "labels", "val"))
  document = dict(project, **{"username": user["username"],"train_path": os.path.join(path, folder_name, "images", "train"), "val_path": os.path.join(path, folder_name, "images", "val")})
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
    cursor = collection_images.find({"username": user["username"]})
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
    if not images:
        raise HTTPException(status_code=404, detail="No images found in the project.")

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
      for img in paths_to_images:
            results_list = []
            for model in models:
                result = model(img)
                results_list.append(result)

            # Bounding Boxes, Scores, and Labels
            boxes_list = []
            scores_list = []
            labels_list = []


            for results in results_list:

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
                            iou_matrix[idx_i, idx_j] = iou(boxes_i, boxes_j)
                    iou_df = pd.DataFrame(iou_matrix, index=[f"Model {i} Box {idx_i}" for idx_i in range(len(boxes_list[i]))],
                                        columns=[f"Model {j} Box {idx_j}" for idx_j in range(len(boxes_list[j]))])
                    iou_matrices.append(iou_df)

            roi_matches, matches, min_matches = get_roi_matches(iou_matrices)

            #Get Classes for each min value in each iou_matrices
            test_min = []
            for match in min_matches:
                min_match = merge_subarrays_match(match,matches.copy())
                test_min.append(min_match)

            class_matches = get_class_matches(test_min,labels_list)

            #Calculate Consensus Score
            variation_ratios = variation_ratio(class_matches)
            variation_ratios = [[ratio] for ratio in variation_ratios]

            min_values = []
            for entry in roi_matches:
                min_values.append(min(entry))

            #To numpy for multiplication
            min_values = np.array(min_values)
            variation_ratios = np.array(variation_ratios)

            consensus_score = 1 - np.mean(np.multiply(min_values,variation_ratios))

            result = [results_list[0].pandas().xywhn[0] ,consensus_score, img]

            rankings_list.append(result)

    if(len(models) == 1):
        for img in paths_to_images:
            results = models[0](img)
            df = results.pandas().xyxy[0]
            confidence_scores = df['confidence'].values.tolist()
            average_confidence_score = np.mean(confidence_scores)
            result = [results.pandas().xywhn[0] ,average_confidence_score, img]
            rankings_list.append(result)

    # Sort the rankings list by the uncertainty score in descending order
    rankings_list.sort(key=lambda x: x[1], reverse=True)

    # Create a new list of lists with the image name and rank
    ranked_images = {}
    for rank, item in enumerate(rankings_list, start=1):
        image_name = item[2]
        ranked_images[image_name] = rank

    updated_ranks = []
    images = await collection_images.find({"project_id": project_id}).to_list(None)
    for img in images:
        filter = {"project_id": project_id, "path": img["path"]}
        update = {"$set": {"ranking": ranked_images.get(img["path"], 0)}}
        result = await collection_images.find_one_and_update(filter, update)
        updated_ranks.append(dict(result))


    return updated_ranks

async def fetch_selected_images(project_id):
    images = []
    cursor = collection_images.find({"project_id": project_id, "selected":True})
    async for document in cursor:
        image = Image(**document)
        images.append(image)
    return images

async def prepare_for_training(project_id, user):

    project = await collection_projects.find_one({"_id": ObjectId(project_id)})
      # specify the path where you want to create the new folder
    path = "storage\\Projects\\"
    # specify the name of the new folder
    folder_name = user["username"] + "_" + project["name"]
    train_dir = path + folder_name + "\\" + "images" + "\\"+ "train"#os.path.join(path, folder_name, "images", "train")
    val_dir = path + folder_name + "\\" + "images" + "\\"+ "val"
    train_ratio = 0.8  # ratio of images to use for training

    # Get list of selected images
    # Get image paths
    images = []
    images_for_return = []
    cursor = collection_images.find({"project_id": project_id, "selected": True})
    async for document in cursor:
        path = document["path"]
        images.append(path)
        images_for_return.append(Image(**document))

    # Split into training and validation sets
    num_train = int(len(images) * train_ratio)
    random.shuffle(images)
    train_images = images[:num_train]
    val_images = images[num_train:]

    # Copy training images to training directory
    for image_path in train_images:
        basename = os.path.basename(image_path)
        dest_path = os.path.join(train_dir, basename)
        shutil.copyfile(image_path, dest_path)

    # Copy validation images to validation directory
    for image_path in val_images:
        basename = os.path.basename(image_path)
        dest_path = os.path.join(val_dir, basename)
        shutil.copyfile(image_path, dest_path)

    return images_for_return



async def train_models(project_id, models_id, image_size, epoch_len, batch_size, class_names):
    model = collection_models.find_one({"_id": ObjectId(models_id)})
    if not model:
        raise HTTPException(status_code=404, detail="No models found in the project.")
    project = collection_projects.find_one({"project_id": ObjectId(project_id)})

    dict_file = [{'path': [project["path"]]},{'train':[project["train_path"]]},{'val':[project['val_path']]}, {'names': class_names}]

    #Create YAML

    with open(project["path"] + "\\data.yaml") as file:
        documents = yaml.dump(dict_file,file)

async def upload_annotation(annotation, user):
  document = dict(annotation, **{"username": user["username"]})
  check_same_annotation = await collection_annotations.find_one({"name" : document["name"]})
  check_same_project = await collection_annotations.find_one({"image_id" : document["image_id"]})
  if check_same_annotation or check_same_project:
      raise HTTPException(status_code=404, detail="Change Annotations name or Image ID!")
  check_same_path = await collection_annotations.find_one({"name" : document["path"]})
  if check_same_path and check_same_project:
      raise HTTPException(status_code=404, detail="Same path as an other annotation!")
  await collection_annotations.insert_one(document)
  return document


async def update_annotation(id, annotation, user):
    doc = dict(annotation)
    try:
        document = await collection_annotations.find_one({"_id": ObjectId(id)})
    except InvalidId:
        raise HTTPException(
            status_code=422, detail="Id not in the right format")
    if not document:
        raise HTTPException(status_code=404, detail="ID not found")
    if user["username"] != document["username"]:
        raise HTTPException(status_code=403, detail="Unauthorized")
    updated_annotation = await collection_annotations.find_one_and_update({"_id": ObjectId(id)}, {"$set": {"name": doc["name"], "path": doc["path"], "image_id":doc["image_id"], "project_id":doc["project_id"]}})
    return updated_annotation


async def delete_annotation(id, user):
    try:
        document = await collection_annotations.find_one({"_id": ObjectId(id)})
    except InvalidId:
        raise HTTPException(
            status_code=422, detail="Id not in the right format")
    if not document:
        raise HTTPException(status_code=404, detail="ID not found")
    if user["username"] != document["username"]:
        raise HTTPException(status_code=403, detail="Unauthorized")
    document = await collection_annotations.find_one_and_delete({"_id": ObjectId(id)})
    return document


async def fetch_annotations_by_user(user):
    annotations = []
    cursor = collection_annotations.find({"username": user})
    async for document in cursor:
        annotation = Annotation(**document)
        annotations.append(annotation)
    return annotations


async def fetch_annotations_by_project(id):
    annotations = []
    cursor = collection_annotations.find({"project_id": id})
    async for document in cursor:
        annotation = Annotation(**document)
        annotations.append(annotation)
    return annotations
