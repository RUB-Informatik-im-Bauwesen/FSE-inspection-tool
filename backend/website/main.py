from fastapi import FastAPI, Depends, APIRouter, UploadFile
from fastapi_login import LoginManager
from fastapi.security import OAuth2PasswordRequestForm
from fastapi_login.exceptions import InvalidCredentialsException
from fastapi.middleware.cors import CORSMiddleware
from backend.website.db import collection_users, collection_annotations, collection_images, collection_projects, collection_rankings
from backend.website.models import User, NewUser, NewProject, Project, NewImage, Image, NewModel, Model, NewAnnotation, Annotation, TrainModel, AnnotationModel, pathModel
from backend.website.crud import create_user, create_project, update_project, delete_project, fetch_projects_by_user, upload_image, update_image, delete_image, fetch_images_by_user, fetch_images_by_projects, upload_model, update_model, delete_model, fetch_models_by_user, fetch_models_by_project, fetch_rankings_images_by_project, fetch_selected_images, prepare_for_training, train_models, upload_annotation, update_annotation, delete_annotation, fetch_annotations_by_user, fetch_annotations_by_project, prepare_model_folder, upload_image_input, upload_model_input, upload_annotation_input, annotate_images_cvat, get_csv, uploadCSV, get_annotated_images, validate_model, get_valid_data
import logging
from typing import List, Dict
from datetime import timedelta
from time import sleep
from asyncio import sleep as async_sleep
from starlette.concurrency import run_in_threadpool

app = FastAPI()

origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

#For authentication later
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

    access_token = manager.create_access_token(data={"sub": username}, expires=timedelta(hours=12))
    return {"access_token": access_token}

@app.get("/get_user")
async def get_user(user=Depends(manager)):
    return user["username"]

#Projects

@app.post("/create_project")
async def new_project(project: NewProject, user=Depends(manager)):
    await create_project(project,user)
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

#Images

@app.post("/upload_image")
async def upload_images(image: NewImage, user=Depends(manager)):
    await upload_image(image, user)
    return image

@app.post("/upload_images_input/{id}")
async def upload_images_input(id:str, file: UploadFile, user=Depends(manager)):
    contents = await upload_image_input(id=id, file=file, user=user)
    return contents

@app.patch("/update_image/{id}")
async def update_images(id:str, image: Dict, user=Depends(manager)):
    item = await update_image(id, image, user)
    return Image(**item)

@app.delete("/delete_image/{id}")
async def delete_images(id:str, user=Depends(manager)):
    item = await delete_image(id, user)
    return Image(**item)

@app.get("/get_images_by_user")
async def get_images(user=Depends(manager)):
    images = await fetch_images_by_user(user)
    return images


@app.get("/get_images_by_project/{id}")
async def get_project_images(id :str , user=Depends(manager)):
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

#Models

@app.post("/upload_model")
async def upload_models(model:NewModel, user=Depends(manager)):
    await upload_model(model, user)
    return model

@app.post("/upload_models_input/{id}")
async def upload_models_input(id:str, file: UploadFile, user=Depends(manager)):
    contents = await upload_model_input(id=id, file=file, user=user)
    return contents

@app.patch("/update_model/{id}")
async def update_models(id: str, model:Dict, user=Depends(manager)):
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
async def prepare_models_folder(id:str):
    model = await prepare_model_folder(id)
    return model

@app.post("/upload_csv/{id}")
async def upload_csvs(id:str,  file: UploadFile, user=Depends(manager)):
    response = await uploadCSV(id, file, user)
    return response

@app.get("/predict_images/{id}")
async def get_rendered_images(id: str,  user=Depends(manager)):
    rendered_images = await get_annotated_images(id, user)
    return rendered_images

#Annotations

@app.post("/upload_annotations")
async def upload_annotations(annotation: NewAnnotation, user=Depends(manager)):
    await upload_annotation(annotation, user)
    return annotation

@app.post("/upload_annotations_input/{project_id}/{image_id}")
async def upload_annotations_input(project_id:str, image_id:str, file: UploadFile, user=Depends(manager)):
    contents = await upload_annotation_input(project_id=project_id,image_id=image_id, file=file, user=user)
    return contents

@app.put("/update_annotation/{id}")
async def update_annotations(id: str, annotation: NewAnnotation, user=Depends(manager)):
    item = await update_annotation(id, annotation,user)
    return Annotation(**item)

@app.delete("/delete_annotation/{id}")
async def delete_annotations(id: str, user=Depends(manager)):
    item = await delete_annotation(id, user)
    return Annotation(**item)

@app.get("/get_annotations_by_user")
async def get_annotations_by_user(user: str):
    annotations =  await fetch_annotations_by_user(user)
    return annotations

@app.get("/get_annotations_by_project/{id}")
async def get_annotations_by_project(id: str):
    annotations = await fetch_annotations_by_project(id)
    return annotations

#Active Learning

@app.get("/get_rankings_of_images/{project_id}")
async def get_rankings_of_images(project_id: str, user=Depends(manager)):
    images_with_rankings = await fetch_rankings_images_by_project(project_id)
    ranked_images = []
    for ranked_image in images_with_rankings:
        ranked_images.append(Image(**ranked_image))
    return ranked_images


@app.post("/train_model/{project_id}")
async def train_model(project_id: str, trainmodel: TrainModel, user=Depends(manager)):
    await train_models(project_id, trainmodel, user)
    return project_id

#CVAT

@app.post("/annotate_on_cvat/{project_id}")
async def annotate_selected_images(project_id: str,annotationModel:AnnotationModel, user=Depends(manager)):
    await annotate_images_cvat(project_id, annotationModel, user)
    return project_id

#Statistics
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