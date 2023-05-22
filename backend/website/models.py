from typing import List, Optional, Union, Tuple
from pydantic import BaseModel, Field, EmailStr
from bson.objectid import ObjectId as BsonObjectId

#Unique ID setup
class PydanticObjectId(BsonObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not isinstance(v, BsonObjectId):
            raise TypeError("Object ID necessary")
        return str(v)

# User model
class User(BaseModel):
    username: str
    password: str

class NewUser(User):
    id: PydanticObjectId = Field(..., alias="_id")


# Project model
class NewProject(BaseModel):
    name: str
    description: Optional[str]

class Project(NewProject):
    id: PydanticObjectId = Field(..., alias="_id")


# Image model
class NewImage(BaseModel):
    name: str
    file_type: str
    path: str
    ranking: int
    selected: bool
    project_id: str

class Image(NewImage):
    id: PydanticObjectId = Field(..., alias="_id")

# Model model
class NewModel(BaseModel):
    name: str
    file_type: str
    date_uploaded: str
    path: str
    project_id: str

class Model(NewModel):
    id: PydanticObjectId = Field(..., alias="_id")

class NewAnnotation(BaseModel):
    name:str
    path:str
    image_id: str
    project_id: str

class Annotation(NewAnnotation):
    id: PydanticObjectId = Field(..., alias="_id")