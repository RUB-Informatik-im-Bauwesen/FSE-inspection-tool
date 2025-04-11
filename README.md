</div>

<h1 align="center">🧯 Web-Based Fire Safety Inspection Platform Using ML Services 🤖📸</h1>
<p align="center">

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
### A NVIDIA GPU is required to run the backend!

### Step 1 (Clone the Git Repository):
URL: https://github.com/RUB-Informatik-im-Bauwesen/fse-web-tool.git (github.com)
### Step 2
Download docker desktop: https://www.docker.com/products/docker-desktop/
### Step 3:
Build and start the services defined in the docker-compose.yml file:
```
docker compose build
docker compose up -d
```

### Step 4:
Acess Localhost at: http://127.0.0.1:5173/

### Step 5:
Enjoy!


# Downloading Models and Images:
To use this application, you need YOLOv8 weights and organize them as described below. The weights can be requested from **Angelina Aziz** via email at **angelina.aziz@ruhr-uni-bochum.de**.

### Directory Structure for Weights
Organize the weights for each service in the following structure:
```plaintext
storage/
└── Visual_Annotation_Tool/
    ├── Detection_Condition_amodal_Yolov8/
    │   └── best.pt
    ├── Detection_Condition_modal_Yolov8/
    │   └── best.pt
    ├── Detection_fire_class_symbols_Yolov8/
    │   └── best.pt
    ├── Detection_FSE_Yolov8/
    │   └── best.pt
    └── Detection_marking_Yolov8/
        └── best.pt
```
