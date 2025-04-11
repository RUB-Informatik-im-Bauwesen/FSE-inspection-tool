from fastapi import FastAPI, Depends, APIRouter, UploadFile, File, HTTPException
from fastapi_login import LoginManager
from fastapi.security import OAuth2PasswordRequestForm
from fastapi_login.exceptions import InvalidCredentialsException
from fastapi.middleware.cors import CORSMiddleware
from backend.website.db import collection_users, collection_annotations, collection_images, collection_projects, collection_rankings, collection_jsons
from backend.website.models import User, NewUser, NewProject, Project, NewImage, Image, NewModel, Model, NewAnnotation, Annotation, TrainModel, AnnotationModel, pathModel, NewPrompt
from backend.website.crud import create_user, create_project, update_project, delete_project, fetch_projects_by_user, upload_image, update_image, delete_image, fetch_images_by_user, fetch_images_by_projects, upload_model, update_model, delete_model, fetch_models_by_user, fetch_models_by_project, fetch_rankings_images_by_project, fetch_selected_images, prepare_for_training, train_models, upload_annotation, update_annotation, delete_annotation, fetch_annotations_by_user, fetch_annotations_by_project, prepare_model_folder, upload_image_input, upload_model_input, upload_annotation_input, annotate_images_cvat, get_csv, uploadCSV, get_annotated_images, validate_model, get_valid_data, download_models, download_image, download_annotations, download_predicted_image, writeToPublic_KI_Dienste, get_predicted_image_KI_Dienst, download_zipped, fetch_jsons
import logging
from typing import List, Dict
from datetime import timedelta
from time import sleep
from asyncio import sleep as async_sleep
from starlette.concurrency import run_in_threadpool
import cv2
import numpy as np
import time
from fastapi.responses import JSONResponse
from ultralytics import YOLO

app = FastAPI()

origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# For authentication later
SECRET = "super-secret-key"
manager = LoginManager(SECRET, "/login")

# User Login and auth


@manager.user_loader()
async def query_user(username):
    document = await collection_users.find_one({"username": username})
    return document


@app.post("/register")
async def new_user(user: User):
    await create_user(user)
    return user


@app.post("/login")
async def login(data: OAuth2PasswordRequestForm = Depends()):
    username = data.username
    password = data.password

    user = await query_user(username)
    if not user:
        raise InvalidCredentialsException
    if user["password"] != password:
        raise InvalidCredentialsException

    access_token = manager.create_access_token(
        data={"sub": username}, expires=timedelta(hours=12))
    return {"access_token": access_token}


@app.get("/get_user")
async def get_user(user=Depends(manager)):
    return user["username"]

# Projects


@app.post("/create_project")
async def new_project(project: NewProject, user=Depends(manager)):
    await create_project(project, user)
    return project


@app.put("/update_project/{id}")
async def update_projects(id: str, name: str, description: str,  user=Depends(manager)):
    item = await update_project(id, name, description, user)
    return Project(**item)


@app.delete("/delete_project/{id}")
async def delete_projects(id: str, user=Depends(manager)):
    item = await delete_project(id, user)
    return Project(**item)


@app.get("/get_all_projects_by_user")
async def get_projects_by_user(user=Depends(manager)):
    projects = await fetch_projects_by_user(user)
    return projects

# Images


@app.post("/upload_image")
async def upload_images(image: NewImage, user=Depends(manager)):
    await upload_image(image, user)
    return image


@app.post("/upload_images_input/{id}")
async def upload_images_input(id: str, file: UploadFile, user=Depends(manager)):
    contents = await upload_image_input(id=id, file=file, user=user)
    return contents

@app.post("/upload_image_KI_Dienste")
async def upload_images_KI_Dienst(file: UploadFile):
    contents = await writeToPublic_KI_Dienste(file=file)
    return contents


@app.patch("/update_image/{id}")
async def update_images(id: str, image: Dict, user=Depends(manager)):
    item = await update_image(id, image, user)
    return Image(**item)


@app.delete("/delete_image/{id}")
async def delete_images(id: str, user=Depends(manager)):
    item = await delete_image(id, user)
    return Image(**item)


@app.get("/get_images_by_user")
async def get_images(user=Depends(manager)):
    images = await fetch_images_by_user(user)
    return images


@app.get("/get_images_by_project/{id}")
async def get_project_images(id: str, user=Depends(manager)):
    images = await fetch_images_by_projects(id)
    return images


@app.get("/get_selected_images_by_project/{id}")
async def get_selected_images(id: str, user=Depends(manager)):
    images = await fetch_selected_images(id)
    return images


@app.get("/prepare_selected_for_training/{id}")
async def prepare_selected_images(id: str, user=Depends(manager)):
    images = await prepare_for_training(id, user)
    return images


@app.get("/download_image_new/{id}")
async def download_new_image(id: str, user=Depends(manager)):
    image_new = await download_image(id, user)
    return image_new

@app.get("/test")
async def get_temp_file():
    return "it works"

@app.post("/download_predicted_image/")
async def download_demo_image(pathToFile: pathModel, user=Depends(manager)):
    fileToDownload = await download_predicted_image(pathToFile,user)
    return fileToDownload

# Models


@app.post("/upload_model")
async def upload_models(model: NewModel, user=Depends(manager)):
    await upload_model(model, user)
    return model


@app.post("/upload_models_input/{id}")
async def upload_models_input(id: str, file: UploadFile, user=Depends(manager)):
    contents = await upload_model_input(id=id, file=file, user=user)
    return contents


@app.patch("/update_model/{id}")
async def update_models(id: str, model: Dict, user=Depends(manager)):
    item = await update_model(id, model, user)
    return Model(**item)


@app.delete("/delete_model/{id}")
async def delete_models(id: str, user=Depends(manager)):
    item = await delete_model(id, user)
    return Model(**item)


@app.get("/get_models_by_user")
async def get_models(user: str):
    models = await fetch_models_by_user(user)
    return models


@app.get("/get_models_by_project/{id}")
async def get_models(id: str):
    models = await fetch_models_by_project(id)
    return models


@app.post("/create_model_folder/{id}")
async def prepare_models_folder(id: str):
    model = await prepare_model_folder(id)
    return model


@app.post("/upload_csv/{id}")
async def upload_csvs(id: str,  file: UploadFile, user=Depends(manager)):
    response = await uploadCSV(id, file, user)
    return response


@app.get("/predict_images/{id}")
async def get_rendered_images(id: str,  user=Depends(manager)):
    rendered_images = await get_annotated_images(id, user)
    return rendered_images


@app.get("/download_model_new/{id}")
async def download_new_model(id: str, user=Depends(manager)):
    model_new = await download_models(id, user)
    return model_new

# Annotations


@app.post("/upload_annotations")
async def upload_annotations(annotation: NewAnnotation, user=Depends(manager)):
    await upload_annotation(annotation, user)
    return annotation


@app.post("/upload_annotations_input/{project_id}/{image_id}")
async def upload_annotations_input(project_id: str, image_id: str, file: UploadFile, user=Depends(manager)):
    contents = await upload_annotation_input(project_id=project_id, image_id=image_id, file=file, user=user)
    return contents


@app.put("/update_annotation/{id}")
async def update_annotations(id: str, annotation: NewAnnotation, user=Depends(manager)):
    item = await update_annotation(id, annotation, user)
    return Annotation(**item)


@app.delete("/delete_annotation/{id}")
async def delete_annotations(id: str, user=Depends(manager)):
    item = await delete_annotation(id, user)
    return Annotation(**item)


@app.get("/get_annotations_by_user")
async def get_annotations_by_user(user: str):
    annotations = await fetch_annotations_by_user(user)
    return annotations


@app.get("/get_annotations_by_project/{id}")
async def get_annotations_by_project(id: str):
    annotations = await fetch_annotations_by_project(id)
    return annotations


@app.get("/download_annotation_new/{id}")
async def download_new_annotation(id: str, user=Depends(manager)):
    annotation_new = await download_annotations(id, user)
    return annotation_new

# Active Learning


@app.get("/get_rankings_of_images/{project_id}/{diversity_sampling}")
async def get_rankings_of_images(project_id: str, diversity_sampling: str, user=Depends(manager)):
    images_with_rankings = await fetch_rankings_images_by_project(project_id, diversity_sampling)
    ranked_images = []
    for ranked_image in images_with_rankings:
        ranked_images.append(Image(**ranked_image))
    return ranked_images


@app.post("/train_model/{project_id}")
async def train_model(project_id: str, trainmodel: TrainModel, user=Depends(manager)):
    await train_models(project_id, trainmodel, user)
    return project_id

# CVAT


@app.post("/annotate_on_cvat/{project_id}")
async def annotate_selected_images(project_id: str, annotationModel: AnnotationModel, user=Depends(manager)):
    success = await annotate_images_cvat(project_id, annotationModel, user)
    return project_id if success else success

# Statistics


@app.post("/get_csv")
async def get_csvs(path: pathModel):
    boolean = await get_csv(path)
    return boolean


@app.get("/validate_model/{id}")
async def validate_models(id: str, user=Depends(manager)):
    path_to_results = await validate_model(id, user)
    return path_to_results


@app.post("/get_validation_data")
async def get_validation_data(path: pathModel):
    validData = await get_valid_data(path)
    return validData

#KIDienste

@app.get("/predict_image_KI_Dienste/{Dienst}/{imageName}")
async def predict_image_KI_Dienste(Dienst:str, imageName:str, user=Depends(manager)):
    print("Predicting image with KI Dienst: ", Dienst)
    # Record the start time
    start_time = time.time()
    image_and_name, timeArray = await get_predicted_image_KI_Dienst(Dienst, imageName, user)
    # Record the end time
    end_time = time.time()
    # Calculate the duration
    duration = end_time - start_time
    return [image_and_name, duration, timeArray]

@app.get("/download_image_json/{imageName}")
async def download_image_json(imageName: str, user=Depends(manager)):
    downloaded_zip = await download_zipped(imageName, user)
    return downloaded_zip

@app.get("/get_collection_jsons")
async def get_collection_jsons():
    collection = await fetch_jsons()
    return collection


@app.post("/predict_webcam_real_time/{Dienst}")
async def predict_webcam_real_time(Dienst: str, file: UploadFile = File(...)):
    # Define a dictionary to map keywords to model paths
    keyword_paths = {
        "Wartungsinformationen": "storage/Visual_Annotation_Tool/Detektion_Wartungsinformationen_Yolov8/best.pt",
        "Prüfplakettenaufkleber": "storage/Visual_Annotation_Tool/Detektion_Prüfplakettenaufkleber_Yolov8/best.pt",
        "Brandschutzanlagen": "storage/Visual_Annotation_Tool/Detektion_Brandschutzanlagen_Yolov8/best.pt",
        "Sicherheitsschilder": "storage/Visual_Annotation_Tool/Detektion_Sicherheitsschilder_Yolov8/best.pt",
        "Blockiertheit_modal": "storage/Visual_Annotation_Tool/Detektion_Blockiertheit_modal_Yolov8/best.pt",
        "Blockiertheit_amodal": "storage/Visual_Annotation_Tool/Detektion_Blockiertheit_amodal_Yolov8/best.pt",
        "Blockiertheit_areal": ["storage/Visual_Annotation_Tool/Detektion_Blockiertheit_modal_Yolov8/best.pt","storage/Visual_Annotation_Tool/Detektion_Blockiertheit_amodal_Yolov8/best.pt"],
    }

    # Get the keyword from Dienst (assuming it's a string)
    keyword = Dienst.strip()

    # Use the keyword to get the corresponding model path
    model_path =keyword_paths.get(keyword)

    if model_path is None:
        raise HTTPException(status_code=404, detail="Model not found!")
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if keyword != "Blockiertheit_areal":
        # Perform object detection
        model = YOLO(model_path)
        classNames = model.names
        # Perform object detection
        results = model(img)

        # Extract detection results
        detections = []
        for r in results:
            for box in r.boxes:
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                confidence = round(float(box.conf[0]), 2)
                cls = int(box.cls[0])
                label = classNames[cls]
                detections.append({
                    "label": label,
                    "confidence": confidence,
                    "x": x1,
                    "y": y1,
                    "width": x2 - x1,
                    "height": y2 - y1
                })

        # Extract segmentation results if available
        if hasattr(r, 'masks') and r.masks is not None:
            masks = r.masks.data.cpu().numpy()  # Convert masks to numpy array
            for i, mask in enumerate(masks):
                detections[i]["mask"] = mask.tolist()  # Convert mask to list for JSON serialization
        """
    else:
        
        # Perform object detection
        model1 = YOLO(model_path[0])
        model2 = YOLO(model_path[1])
        classNames = model2.names
        # Perform object detection
        results1 = model1(img)
        results2 = model2(img)

        # Extract detection results
        detections = []
        for r1,r2 in zip(results1,results2):
            for box in r2.boxes:
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                confidence = round(float(box.conf[0]), 2)
                cls = int(box.cls[0])
                label = classNames[cls]
                detections.append({
                    "label": label,
                    "confidence": confidence,
                    "x": x1,
                    "y": y1,
                    "width": x2 - x1,
                    "height": y2 - y1
                })

        # Extract segmentation results if available
        mask1 = r1.masks.data.cpu().numpy()  # Convert masks to numpy array
        mask2 = r2.masks.data.cpu().numpy()  # Convert masks to numpy array
        mask1 = (mask1 > 0).astype(np.uint8)  # Convert to binary mask if not already
        mask2 = (mask2 > 0).astype(np.uint8)

        # Compute the difference mask: areas in mask2 not in mask1
        difference_mask = np.bitwise_and(mask2, np.bitwise_not(mask1))
        # Convert the binary mask back to a format suitable for visualization
        visualization_mask = (difference_mask * 255).astype(np.uint8)
        for i, mask in enumerate(difference_mask):
            detections[i]["mask"] = mask.tolist()  # Convert mask to list for JSON serialization
        """


    return JSONResponse(content={"detections": detections})
