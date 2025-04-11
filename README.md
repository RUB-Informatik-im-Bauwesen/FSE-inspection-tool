</div>

**Web-Based Fire Safety Inspection Platform Utilizing FSE ML Services**

This project is a **web-based tool** designed to simplify the process of **fire safety inspection and documentation** utilizing **FSE ML services**. 
It provides an intuitive interface for users to annotate images, manage datasets, and iteratively improve object detection models. 

This repository is based on the research presented in the following publications:
- Aziz, A., & König, M. (Forthcoming). *Creation of a web-based tool for the visual inspection of building equipment*.
- Soultana, A., & Aziz, A. (2023). *Active learning approach for object detection in technical building equipment images*. Ruhr-Universität Bochum.


## Overview


This repository provides:
- A **Backend API** built with FastAPI to handle model inference, training, and data management.
- A **Frontend Interface** for annotating images, managing datasets, and visualizing results.
- **Pre-trained and executable ML models** for detecting FSE objects and FSE-related information in images.
- An **Active Learning Framework** for object detection tasks, enabling iterative model improvement.
- Tools for **data preparation**, including downloading and managing validation and rare images.
- Dockerized setup for easy deployment and scalability.

## Setup


### SKIP AHEAD IF YOU WANT TO USE DOCKER

### Step 1 (Cloning the Git Repository):

URL: Hydropic/Active-Learning-Application-for-Object-Detection-on-a-Technical-Building-Equipment-Dataset (github.com)

### Step 2 (Creating the Database):
  - Set the port in docker-compose.yaml to "27017:27017".
  - Run the command:  
  ```
  docker-compose up 
  ```
  - (OPTIONAL) Download MongoDB Compass and connect to the database using the following URL:     
 “mongodb://root:example@localhost:27017/”

### Step 3 (Creating a Virtual Environment):
  - Run the command: 
  ```
  python -m venv venv
  ```
  - Then activate the virtual environment using: 
  ```
  venv\Scripts\Activate.ps1
  ```
  - Finally, install the required dependencies: 
  ```
  pip install -r requirements.txt
  ```

### Step 4 (Starting the Backend):
  - Run the backend with the following command: 
  ```
  uvicorn backend.website.main:app –reload
  ```

### Step 5 (Starting the Frontend):
  - Open a new PowerShell window and navigate to the frontend directory: 
  ```
  cd frontend
  ```
  - Install dependencies: 
  ```
  npm install
  ```
  - Finally, start the frontend: 
  ```
  npm run dev
  ```




---------------------

### IF DOCKER IS INSTALLED (RECOMMENDED)

### Step 1 (Clone the Git Repository):

URL: https://github.com/RUB-Informatik-im-Bauwesen/fse-web-tool.git (github.com)

### Step 2:
Start the services defined in the docker-compose.yml file:
```
docker compose up -d
```

### Step 3:
Acess Localhost at: http://127.0.0.1:5173/

### Step 4:
Enjoy!


# Downloading Models and Images:
To use this application, you need YOLOv8 weights and organize them as described below. The weights can be requested from **Angelina Aziz** via email at **angelina.aziz@ruhr-uni-bochum.de**.

### Directory Structure for Weights
Organize the weights for each service in the following structure:
```plaintext
storage/
└── Visual_Annotation_Tool/
    ├── Detektion_Blockiertheit_amodal_Yolov8/
    │   └── best.pt
    ├── Detektion_Blockiertheit_modal_Yolov8/
    │   └── best.pt
    ├── Detektion_Brandschutzanlagen_Yolov8/
    │   └── best.pt
    ├── Detektion_Sicherheitsschilder_Yolov8/
    │   └── best.pt
    └── Detektion_Wartungsinformationen_Yolov8/
        └── best.pt
```
  - Download validation images from this link: (https://drive.google.com/file/d/1nueXWhQNkAwiC7LDdTp8bbO2GRrOHo88/view?usp=sharing) and replace the folder in Storage.
  
  - Download rare images from this link: (https://drive.google.com/file/d/1jgORHgpLZ_uT1sp0gbRu2Gpfae_wyDKU/view?usp=sharing) and replace the folder in Storage.
