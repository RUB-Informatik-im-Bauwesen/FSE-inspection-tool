import os
import time
import io
import zipfile
import requests
import asyncio

async def wait_for_job_completion(job_id, jobs_endpoint, auth):
    while True:
        response = requests.get(f"{jobs_endpoint}/{job_id}", auth=auth)
        job_status = response.json()["state"]
        if job_status == "completed":
            break
        await asyncio.sleep(5)

async def wait_for_annotations_completion(task_id, auth):
    while True:
        response = requests.get(f"http://cvatserver:8080/api/tasks/{task_id}/annotations", auth=auth)
        annotations_status = response.json()["status"]
        if annotations_status == "completed":
            break
        await asyncio.sleep(5)

async def create_and_upload_task(server, api_version, auth, image_files, labels, annotations_path=""):
    # Define working directory
    current_dir = os.getcwd()
    training_dir = "storage/CVAT"

    tasks_endpoint = f"{server}/{api_version}/tasks"
    jobs_endpoint = f"{server}/{api_version}/jobs"

    create_task_data = {
        "name": "string2",
        "owner_id": 1,
        "bug_tracker": "string",
        "overlap": 0,
        "segment_size": 0,
        "labels": labels
    }

    # create task
    response = requests.post(tasks_endpoint, json=create_task_data, auth=auth)
    print(response)
    task_id = response.json()['id']
    task = response.json()
    print(task)
    print("Task created with ID: ", task_id)

    # upload image to task
    data = {'image_quality': 90}
    files = {f'client_files[{i}]': open(f, 'rb') for i, f in enumerate(image_files)}
    task_data_endpoint = f"{tasks_endpoint}/{task_id}/data"
    response = requests.post(task_data_endpoint, files=files, data=data, auth=auth)
    print("Image uploaded to task with response: ", response.text)

    # Wait for completion
    task_jobid_endpoint = f"{tasks_endpoint}/{task_id}"
    while True:
        response = requests.get(task_jobid_endpoint, auth=auth)
        response.raise_for_status()
        job = response.json()["status"]
        print(job)
        if job == "completed":
            print("Task finished")
            break
        await asyncio.sleep(1)

    # Upload annotations if present
    if annotations_path:
        url = f"http://cvatserver:8080/api/tasks/{task['id']}/annotations?format=COCO+1.0"
        with open(annotations_path, 'rb') as f:
            annotations_data = {
                'annotation_file': f
            }
            annotations_response = requests.put(url, files=annotations_data, auth=auth, timeout=5)
            if annotations_response.status_code == 202:
                print('Annotations uploaded successfully!')
                print(f"Upload annotations 2.5 request: {annotations_response}, data: {annotations_response.content}")
            else:
                print(f'Error uploading annotations: {annotations_response.content}')

    #print("Waiting for annotations...")
    #await wait_for_job_completion(job[0]["id"], jobs_endpoint, auth)

    print("Annotations finished... Now downloading")

    # Download Annotations
    fileformat = 'YOLO+1.1'
    task_dataset_endpoint = f"http://cvatserver:8080/api/tasks/{task_id}/annotations?format={fileformat}"
    while True:
        response = requests.get(task_dataset_endpoint, auth=auth)
        response.raise_for_status()
        print('STATUS {}'.format(response.status_code))
        if response.status_code == 201:
            break

    response = requests.get(task_dataset_endpoint + '&action=download', auth=auth)
    response.raise_for_status()

    z = zipfile.ZipFile(io.BytesIO(response.content))
    z.extractall(training_dir)

    print("Finished Downloading!")
