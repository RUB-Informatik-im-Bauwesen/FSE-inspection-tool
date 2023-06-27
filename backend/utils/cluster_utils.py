# for loading/processing the images
from keras.utils import load_img
from keras.applications.vgg16 import preprocess_input
import matplotlib as plt
# models
from keras.applications.vgg16 import VGG16
from keras.models import Model

# clustering and dimension reduction
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
from sklearn.decomposition import PCA

# for everything else
import numpy as np
import matplotlib.pyplot as plt

import concurrent.futures
from concurrent.futures import ThreadPoolExecutor
import functools
import asyncio


def extract_features(image, model):

    #Preprocess Images
    img = load_img(image, target_size=(224,224))

    img = np.array(img)

    reshaped_img = img.reshape(1,224,224,3)

    #Get Features from model
    imgx = preprocess_input(reshaped_img)

    features = model.predict(imgx,use_multiprocessing=True)

    return features

def find_optimal_k(data, max_k):
    best_k = 0
    best_score = -1

    for k in range(2, max_k+1):
        kmeans = KMeans(n_clusters=k, random_state=0).fit(data)
        score = silhouette_score(data, kmeans.labels_)
        print(k)
        print(score)
        if score > best_score:
            best_k = k
            best_score = score

    return best_k

def elbow_method(img_paths):

    #Features will be here
    data = {}

    model = VGG16()
    model = Model(inputs = model.inputs, outputs = model.layers[-2].output)

    for img in img_paths:
        feat = extract_features(img,model)
        data[img] = feat

    # get a list of the filenames
    filenames = np.array(list(data.keys()))

    #get a list of just the features
    feat = np.array(list(data.values()))

    # reshape so that there are 210 samples of 4096 vectors
    feat = feat.reshape(-1, 4096)

    # reduce amount of dimensions
    pca = PCA(n_components = 0.95, random_state=22)
    pca.fit(feat)
    x = pca.transform(feat)

    # plot the WCSS as a function of the number of clusters
    wcss = []
    for k in range(1, 10):
        kmeans = KMeans(n_clusters=k, random_state=0, n_init= 10)
        kmeans.fit(x)
        wcss.append(kmeans.inertia_)
    plt.plot(range(1, 10), wcss)
    plt.xlabel('Number of clusters')
    plt.ylabel('WCSS')
    plt.show()


def cluster_images(img_paths):

    #Features will be here
    data = {}

    model = VGG16()
    model = Model(inputs = model.inputs, outputs = model.layers[-2].output)

    for img in img_paths:
        feat = extract_features(img,model)
        print(feat.shape)
        data[img] = feat

    # get a list of the filenames
    filenames = np.array(list(data.keys()))

    #get a list of just the features
    feat = np.array(list(data.values()))

    # reshape so that there are 210 samples of 4096 vectors
    feat = feat.reshape(-1, 4096)
    # reduce amount of dimensions
    pca = PCA(n_components = 0.95, random_state=22)
    pca.fit(feat)
    x = pca.transform(feat)
    #Calculate optimal k
    #optimal_k = find_optimal_k(x,10)
    #print(optimal_k)

    # cluster feature vectors
    kmeans = KMeans(n_clusters=6, random_state=22)
    kmeans.fit(x)


    # calculate distances from each image to its cluster centroid
    classes_images = {}
    distances = {}
    for i, file in enumerate(filenames):
        cluster = kmeans.labels_[i]
        centroid = kmeans.cluster_centers_[cluster]
        distance = np.linalg.norm(x[i] - centroid)
        distances[file] = distance
        classes_images[file] = kmeans.labels_[i]




    # find the feature vector with the highest distance to its corresponding cluster
    max_distances = {}
    for i, file in enumerate(filenames):
        cluster = kmeans.labels_[i]
        centroid = kmeans.cluster_centers_[cluster]
        distance = np.linalg.norm(x[i] - centroid)
        if file not in max_distances or distance > max_distances[file][1]:
            max_distances[file] = (x[i], distance,kmeans.labels_[i])

    return kmeans.cluster_centers_, pca, max_distances

async def cluster_images_async(image_paths):
    # Run the blocking function in a separate thread using the thread pool executor
    loop = asyncio.get_event_loop()
    with ThreadPoolExecutor() as executor:
        return await loop.run_in_executor(executor, cluster_images, image_paths)


def add_image_to_clusters(image_path, centroids, pca, max_distances_labels):
    # Model from keras
    model = VGG16()
    model = Model(inputs=model.inputs, outputs=model.layers[-2].output)

    feat = extract_features(image_path, model)

    # Reduce amount of dimensions
    x = pca.transform(feat)


    # Calculate distances from image to each centroid
    distances = []
    for centroid in centroids:
        distance = np.linalg.norm(x - centroid)
        distances.append(distance)

    # Get label of closest centroid and distance to that centroid
    label = np.argmin(distances)
    distance_to_centroid = distances[label]


    # Find feature vector in max_distances_labels with smallest distance to centroid
    smallest_distance = None
    for path, fv in max_distances_labels.items():
        centroid_image = centroids[label]
        if fv[2] == label:
            dist = np.linalg.norm(fv[0] - centroid_image)
            if smallest_distance is None or dist < smallest_distance:
                smallest_distance = dist
    distance = smallest_distance / distance_to_centroid
    print(smallest_distance)
    print(distance_to_centroid)
    print(distance)
    return distance

async def  add_image_to_clusters_async(image_path, centroids, pca, max_distances_labels):
    # Run the blocking function in a separate thread using the thread pool executor
    loop = asyncio.get_event_loop()
    with ThreadPoolExecutor() as executor:
        return await loop.run_in_executor(executor, add_image_to_clusters, image_path, centroids, pca, max_distances_labels)