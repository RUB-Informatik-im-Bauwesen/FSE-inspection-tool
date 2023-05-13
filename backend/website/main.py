from fastapi import FastAPI, Depends, APIRouter
from fastapi_login import LoginManager
from fastapi.security import OAuth2PasswordRequestForm
from fastapi_login.exceptions import InvalidCredentialsException
from fastapi.middleware.cors import CORSMiddleware
from backend.website.db import collection_users, collection_annotations, collection_images, collection_projects, collection_rankings
from backend.website.models import User, NewUser, NewProject, Project, NewImage, Image, NewModel, Model, NewAnnotation, Annotation
from backend.website.crud import create_user, create_project, update_project, delete_project, fetch_projects_by_user, upload_image, update_image, delete_image, fetch_images_by_user, fetch_images_by_projects, upload_model, update_model, delete_model, fetch_models_by_user, fetch_models_by_project, fetch_rankings_images_by_project, fetch_selected_images, prepare_for_training, train_models, upload_annotation, update_annotation, delete_annotation, fetch_annotations_by_user, fetch_annotations_by_project
import logging
from typing import List

app = FastAPI()

logger = logging.getLogger("api")

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

    access_token = manager.create_access_token(data={"sub": username})
    return {"access_token": access_token}

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
async def get_projects_by_user(user: str):
    projects = await fetch_projects_by_user(user)
    return projects

#Images

@app.post("/upload_image")
async def upload_images(image: NewImage, user=Depends(manager)):
    await upload_image(image, user)
    return image

@app.put("/update_image/{id}")
async def update_images(id:str, image: NewImage, user=Depends(manager)):
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

@app.put("/update_model/{id}")
async def update_models(id: str, model:NewModel, user=Depends(manager)):
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

#Annotations

@app.post("/upload_annotations")
async def upload_annotations(annotation: NewAnnotation, user=Depends(manager)):
    await upload_annotation(annotation, user)
    return annotation

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
async def get_rankings_of_images(project_id: str):
    images_with_rankings = await fetch_rankings_images_by_project(project_id)
    ranked_images = []
    for ranked_image in images_with_rankings:
        ranked_images.append(Image(**ranked_image))
    return ranked_images


@app.post("/train_model/{project_id}")
async def train_model(project_id: str, models_id: str, image_size: int, epoch_len: int, batch_size: int, class_names: List[str]):
    await train_models(project_id, models_id, image_size, epoch_len, batch_size, class_names)
    return project_id