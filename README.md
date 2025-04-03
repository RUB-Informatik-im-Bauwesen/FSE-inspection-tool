<div align="center">

  <h1>Active Learning Application for Object Detection on a Technical Building Equipment Dataset</h1>


  <div>
      Robin Ov&emsp;
      Ayman Soultana&emsp;
      Angelina Aziz&emsp;
  </div>
  <div>
      Ruhr University Bochum

  </div>

</div>

This project is a **web-based tool** designed to simplify the process of **active learning** and **object detection** focusing on **fire safety equipment**. It provides an intuitive interface for users to annotate images, manage datasets, and iteratively improve object detection models. Additionally, the tool integrates an **IFC viewer** to visualize and interact with building information models, enabling seamless analysis and management of fire safety equipment in technical environments.

## Overview


This repository provides:
- An **Active Learning Framework** for object detection tasks, enabling iterative model improvement.
- A **Backend API** built with FastAPI to handle model inference, training, and data management.
- A **Frontend Interface** for annotating images, managing datasets, and visualizing results.
- Pre-trained models for detecting objects in technical building equipment datasets.
- Tools for **data preparation**, including downloading and managing validation and rare images.
- Dockerized setup for easy deployment and scalability.

## Setup

### SKIP AHEAD IF YOU WANT TO USE DOCKER

Step 1 (Cloning the Git Repository):

URL: Hydropic/Active-Learning-Application-for-Object-Detection-on-a-Technical-Building-Equipment-Dataset (github.com)

Step 2 (Creating the Database):
  1. Set the port in docker-compose.yaml to "27017:27017".
  2. Run the command:  
  ```
  docker-compose up 
  ```
  3. (OPTIONAL) Download MongoDB Compass and connect to the database using the following URL:     
 “mongodb://root:example@localhost:27017/”

Step 3 (Creating a Virtual Environment):
  1. Run the command: 
  ```
  python -m venv venv
  ```
  2. Then activate the virtual environment using: 
  ```
  venv\Scripts\Activate.ps1
  ```
  3. Finally, install the required dependencies: 
  ```
  pip install -r requirements.txt
  ```

Step 4 (Downloading Models and Images):
  1. Download validation images from this link: (https://drive.google.com/file/d/1nueXWhQNkAwiC7LDdTp8bbO2GRrOHo88/view?usp=sharing) and replace the folder in Storage.
  2. Download models for the Visual Annotation Tool from this link: (https://drive.google.com/file/d/1vcIlMRK7yZg0_sooOtaNWitnj1suudHJ/view?usp=sharing) and replace the folder in Storage.
  3. Download rare images from this link: (https://drive.google.com/file/d/1jgORHgpLZ_uT1sp0gbRu2Gpfae_wyDKU/view?usp=sharing) and replace the folder in Storage.


Step 5 (Starting the Backend):
  1. Run the backend with the following command: 
  ```
  uvicorn backend.website.main:app –reload
  ```

Step 6 (Starting the Frontend):
  1. Open a new PowerShell window and navigate to the frontend directory: 
  ```
  cd frontend
  ```
  2. Install dependencies: 
  ```
  npm install
  ```
  3. Finally, start the frontend: 
  ```
  npm run dev
  ```




---------------------

### IF DOCKER IS INSTALLED (RECOMMENDED)

Step 1 (Clone the Git Repository):

URL: Hydropic/Active-Learning-Application-for-Object-Detection-on-a-Technical-Building-Equipment-Dataset (github.com)

Step 2:
Start the services defined in the docker-compose.yml file:
```
docker compose up -d
```

Step 3:
Acess Localhost at: http://127.0.0.1:5173/

Step 4:
Enjoy!
