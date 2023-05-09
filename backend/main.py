from fastapi import FastAPI, Depends
from fastapi_login import LoginManager
from fastapi.security import OAuth2PasswordRequestForm
from fastapi_login.exceptions import InvalidCredentialsException
from fastapi.middleware.cors import CORSMiddleware
from backend.db import collection_users, collection_annotations, collection_images, collection_projects, collection_rankings
from backend.models import User, NewUser, NewProject, Project, NewImage, Image
from backend.crud import create_user, create_project, update_project, delete_project, fetch_projects_by_user, upload_image, update_image, delete_image, fetch_images_by_user, fetch_images_by_projects

app = FastAPI()

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

@app.post("/upload_image")
async def upload_images(id: str, image: NewImage, user=Depends(manager)):
    await upload_image(id, image, user)
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
async def get_images(user: str):
    images = await fetch_images_by_user(user)
    return images

@app.get("/get_images_by_project")
async def get_project_images(id :str):
    images = await fetch_images_by_projects(id)
    return images