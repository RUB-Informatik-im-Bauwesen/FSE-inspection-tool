# Backend
from fastapi import FastAPI, Depends, UploadFile
from fastapi_login import LoginManager
from fastapi.security import OAuth2PasswordRequestForm
from fastapi_login.exceptions import InvalidCredentialsException
from fastapi.middleware.cors import CORSMiddleware
from backend.website.db import collection_users, collection_annotations, collection_images, collection_projects, collection_rankings, collection_models
from backend.website.models import User, Project, Image, Model, Annotation, TrainModel, AnnotationModel
from bson.objectid import ObjectId
from bson.errors import InvalidId
from fastapi import HTTPException
from backend.utils.model_utils import iou, get_class_matches, get_roi_matches, merge_subarrays_match, variation_ratio, train_model, render_images
from backend.utils.cvat_utils import create_and_upload_task
import os
import shutil
import random
import yaml
import asyncio
import concurrent.futures
import csv

#Active Learning
import torch
import pandas as pd
import numpy as np

async def create_user(user):
    user = dict(user)
    document = await collection_users.find_one({"username": user["username"]})
    if document:
        raise HTTPException(status_code=409, detail="User already registered")
    await collection_users.insert_one(user)


async def create_project(project, user):
  document = dict(project, **{"username": user["username"]})
  check_name = await collection_projects.find_one({"username": document["username"], "name" :document["name"]})
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
  document = dict(project, **{"username": user["username"],"path":path_print, "train_path": os.path.join(path, folder_name, "images", "train"), "val_path": os.path.join(path, folder_name, "images", "val")})
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
    if os.path.exists(document["path"]):
        shutil.rmtree(document["path"])
    return document

async def fetch_projects_by_user(user):
    projects = []
    cursor = collection_projects.find({"username": user["username"]})
    async for document in cursor:
        project = Project(**document)
        projects.append(project)
    return projects

async def upload_image_input(id, file: UploadFile, user):
    contents = await file.read()

    dest_path = f"frontend/public/{file.filename}"

    with open(dest_path, "wb") as f:
        f.write(contents)

    image = {"name":file.filename, "file_type":"." + file.content_type.split("/")[1],"path":dest_path,"ranking":0,"selected":False,"project_id":id}

    await upload_image(image, user)

    return {"filename":file.filename}

async def upload_image(image, user):
  document = dict(image, **{"username": user["username"]})
  check_same_image = await collection_images.find_one({"name" : document["name"]})
  check_same_project = await collection_images.find_one({"name" : document["name"], "project_id" : document["project_id"]})
  if check_same_image and check_same_project:
      raise HTTPException(status_code=404, detail="Change Image name!")
  await collection_images.insert_one(document)
  return document

async def update_image(id, image, user):
    doc = image
    try:
        document = await collection_images.find_one({"_id": ObjectId(id)})
    except InvalidId:
        raise HTTPException(
            status_code=422, detail="Id not in the right format")
    if not document:
        raise HTTPException(status_code=404, detail="ID not found")
    if user["username"] != document["username"]:
        raise HTTPException(status_code=403, detail="Unauthorized")
    update_data = {"$set": image}  # Assuming `image` contains the fields to update
    updated_image = await collection_images.find_one_and_update({"_id": ObjectId(id)}, update_data)
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

async def uploadCSV(project_id, file: UploadFile, user):
    #Get selected model
    model = await collection_models.find_one({"project_id": project_id, "selected":True})
    if not model:
        raise HTTPException(status_code=404, detail="No models found in the project.")
    model_path = os.path.dirname(os.path.dirname(model["path"]))

    contents = await file.read()

    dest_path = os.path.join(model_path, file.filename)

    with open(dest_path, "wb") as f:
        f.write(contents)

    return {"CSV uploaded!"}

async def upload_model(model, user):
  document = dict(model, **{"username": user["username"]})
  await collection_models.insert_one(document)
  return document

async def upload_model_input(id, file: UploadFile, user):
    contents = await file.read()

    random_int = random.randint(10000000, 99999999)

    dest_folder = f"storage/Models/{file.filename}_{str(random_int)}/weights"
    os.makedirs(dest_folder, exist_ok=True)

    dest_path = os.path.join(dest_folder, file.filename)

    with open(dest_path, "wb") as f:
        f.write(contents)

    model = {"name":file.filename, "file_type":file.content_type,"path":dest_path,"selected":False, "project_id":id}

    await upload_model(model, user)

    return {"filename":file.filename}

async def update_model(id, model, user):
    doc = model
    try:
        document = await collection_models.find_one({"_id": ObjectId(id)})
    except InvalidId:
        raise HTTPException(
            status_code=422, detail="Id not in the right format")
    if not document:
        raise HTTPException(status_code=404, detail="ID not found")
    if user["username"] != document["username"]:
        raise HTTPException(status_code=403, detail="Unauthorized")
    update_data = {"$set": doc}
    updated_model = await collection_models.find_one_and_update({"_id": ObjectId(id)}, update_data)
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

async def prepare_model_folder(id):
    model = collection_models.find({"_id":ObjectId(id)})
    async for doc in model:
        os.makedirs(os.path.dirname(doc["path"]))
    return {"Success": "Created folders"}

async def process_images(models, paths_to_images):
    rankings_list = []

    if (len(models) > 1):
      for img in paths_to_images:
            results_list = []
            for model in models:
                result = await asyncio.to_thread(model,img)
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
            results = await asyncio.to_thread(models[0],img)
            df = results.pandas().xyxy[0]
            confidence_scores = df['confidence'].values.tolist()
            average_confidence_score = np.mean(confidence_scores)
            result = [results.pandas().xywhn[0] ,average_confidence_score, img]
            rankings_list.append(result)

    return rankings_list

def load_model(path):
    return torch.hub.load('ultralytics/yolov5', 'custom', path=path)

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
        model = await asyncio.to_thread(load_model, path)
        models.append(model)

    rankings_list = await process_images(models, paths_to_images)

    # Sort the rankings list by the uncertainty score in descending order
    if(len(models) == 1):
        rankings_list.sort(key=lambda x: x[1], reverse=False)
    else:
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
    train_label_dir = path + folder_name + "\\" + "labels" + "\\"+ "train"
    val_label_dir = path + folder_name + "\\" + "labels" + "\\"+ "val"
    train_ratio = 0.8  # ratio of images to use for training

    # Get list of selected images and get list of annotations from selected images
    # Get image paths
    images = []
    image_ids = []
    images_for_return = []
    annotations = []
    cursor = collection_images.find({"project_id": project_id, "selected": True})
    async for document in cursor:
        path = document["path"]
        images.append(path)
        image_id = str(document["_id"])
        image_ids.append(image_id)
        images_for_return.append(Image(**document))

    for image_id in image_ids:
        annotation = collection_annotations.find({"image_id":image_id})
        async for doc in annotation:
            annotations.append({"name": doc["name"], "path":doc["path"]})

    # Split into training and validation sets
    num_train = int(len(images) * train_ratio)
    random.shuffle(images)
    train_images = images[:num_train]
    val_images = images[num_train:]

    # Copy training images to training directory
    for image_path in train_images:
        basename = os.path.basename(image_path)
        dest_path = os.path.join(train_dir, basename)
        for annotation in annotations:
            imagename = os.path.splitext(basename)[0] + ".txt"
            if annotation["name"] == imagename:
                basename_annotation = os.path.basename(annotation["path"])
                dest_annotation_path = os.path.join(train_label_dir,basename_annotation)
                shutil.copyfile(annotation["path"], dest_annotation_path)
        shutil.copyfile(image_path, dest_path)

    # Copy validation images to validation directory
    for image_path in val_images:
        basename = os.path.basename(image_path)
        dest_path = os.path.join(val_dir, basename)
        for annotation in annotations:
            if annotation["name"] == os.path.splitext(basename)[0] + ".txt":
                basename_annotation = os.path.basename(annotation["path"])
                dest_annotation_path = os.path.join(val_label_dir,basename_annotation)
                shutil.copyfile(annotation["path"], dest_annotation_path)
        shutil.copyfile(image_path, dest_path)

    return images_for_return



async def train_models(project_id, trainmodel, user):
    models_id = trainmodel.models_id
    image_size = trainmodel.image_size
    epoch_len = trainmodel.epoch_len
    batch_size = trainmodel.batch_size
    class_names = trainmodel.class_names

    model = await collection_models.find_one({"project_id": project_id, "selected":True})
    if not model:
        raise HTTPException(status_code=404, detail="No models found in the project.")
    model_path = model["path"]
    project = await collection_projects.find_one({"_id": ObjectId(project_id)})
    project = dict(project)
    names_dict = {i: class_names[i] for i in range(len(class_names))}
    path_to_project = os.getcwd() + "\\" + project["path"]
    data = {
        "path": path_to_project,
        "train": "images/train",
        "val": "images/val",
        "names": names_dict
    }

    with open(project["path"] + "\\data.yaml", "w") as file:
        yaml.dump(data, file, allow_unicode=True)

    new_model = await train_model(model_path, image_size,epoch_len, batch_size, project["path"] + "\\data.yaml",models_id)

    model = {"name":"best"+ "_" + new_model.split("_")[1] +".pt", "file_type":"application/octet-stream","path":"storage/Models/" + new_model + "/weights/best.pt","selected":False, "project_id":project_id}

    await upload_model(model, user)

    for root, dirs, files in os.walk(project["path"]):
        for file in files:
            file_path = os.path.join(root, file)
            try:
                os.remove(file_path)
                print(f'Deleted file: {file_path}')
            except Exception as e:
                print(f'Error deleting file: {file_path}\n{e}')

    return model

async def get_annotated_images(project_id, user):
    #Get Models and Images
    model = await collection_models.find_one({"project_id": project_id, "selected":True})
    if not model:
        raise HTTPException(status_code=404, detail="No models found in the project.")
    model_path = model["path"]

    images = []
    image_ids = []
    cursor = collection_images.find({"project_id": project_id, "selected": True})
    async for document in cursor:
        path = document["path"]
        images.append(path)
        image_id = str(document["_id"])
        image_ids.append(image_id)

    save_path = "storage\Annotated_Images"
    rendered_images = await render_images(model_path, images, save_path)

    return rendered_images



async def upload_annotation(annotation, user):
  document = dict(annotation, **{"username": user["username"]})
  check_same_annotation = await collection_annotations.find_one({"name" : document["name"], "project_id" : document["project_id"]})
  check_same_project = await collection_annotations.find_one({"image_id" : document["image_id"],"project_id" : document["project_id"]})
  if check_same_annotation or check_same_project:
      raise HTTPException(status_code=404, detail="Change Annotations name or Image ID!")
  check_same_path = await collection_annotations.find_one({"name" : document["path"]})
  if check_same_path and check_same_project:
      raise HTTPException(status_code=404, detail="Same path as an other annotation!")
  await collection_annotations.insert_one(document)
  return document

async def upload_annotation_input(project_id, image_id, file: UploadFile, user):
    contents = await file.read()

    dest_path = f"storage/Annotations/{file.filename}"

    with open(dest_path, "wb") as f:
        f.write(contents)

    annotation = {"name":file.filename,"path":dest_path, "image_id":image_id, "project_id":project_id}

    await upload_annotation(annotation, user)

    return {"filename":file.filename}

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

#CVAT

async def annotate_images_cvat(project_id, annotationModel, user):

    #Important folders
    source_folder = "storage/CVAT/obj_train_data"
    dest_folder = "storage/Annotations"

    # Get a list of all files in the folder
    files = os.listdir(source_folder)

    # Delete each file in the folder
    for file in files:
        file_path = os.path.join(source_folder, file)
        os.remove(file_path)

    server = "http://localhost:8080"
    api_version = "api"
    auth = (annotationModel.username, annotationModel.password)
    images = []
    cursor = collection_images.find({"project_id": project_id, "selected": True})
    async for document in cursor:
        path = document["path"]
        image_id = document["_id"]
        images.append([path, image_id])
    labels = labels = [{'name': class_name} for class_name in annotationModel.class_names]

    # Upload images to cvat
    await create_and_upload_task(server=server, api_version=api_version, auth=auth, image_files=[image[0] for image in images],                                labels=labels)

    # Get a list of all files in the source folder
    files = os.listdir(source_folder)

    # Move each .txt file to the destination folder
    for file in files:
        image_id = ""
        for image in images:
            if os.path.splitext(os.path.basename(image[0]))[0] == os.path.splitext(file)[0]:
                image_id = image[1]
        annotation = {"name":file,"path":dest_folder + "/" + file, "image_id":str(image_id), "project_id":project_id}

        check_same_annotation = await collection_annotations.find_one({"name" : annotation["name"], "project_id" : annotation["project_id"]})
        check_same_project = await collection_annotations.find_one({"image_id" : annotation["image_id"],"project_id" : annotation["project_id"]})
        if check_same_annotation or check_same_project:
            document = await collection_annotations.find_one_and_delete({"name": annotation["name"]})

        await upload_annotation(annotation, user)

        source_file = os.path.join(source_folder, file)
        destination_file = os.path.join(dest_folder, file)
        shutil.move(source_file, destination_file)


async def get_csv(pathModel):
    path = pathModel.path
    if os.path.exists(path):
        with open(path, 'r') as file:
            reader = csv.DictReader(file)
            data = list(reader)
        return data
    else:
        return False
