import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { faker } from '@faker-js/faker';
import "./StatisticsStyle.css"
import axios from "axios"


const Statistics = ({accessToken, projects}) => {
  const [selectedModel1, setSelectedModel1] = useState('');
  const [csvDataModel1, setCSVDataModel1] = useState([])
  const [selectedModel2, setSelectedModel2] = useState('');
  const [csvDataModel2, setCSVDataModel2] = useState([])
  const [selectedProject, setSelectedProject] = useState({});
  const [models, setModels] = useState({});
  const [mAP50_M1, setmAP50_M1] = useState(0);
  const [mAP50_M2, setmAP50_M2] = useState(0);
  const [mAP90_M1, setmAP90_M1] = useState(0);
  const [mAP90_M2, setmAP90_M2] = useState(0);
  const [Recall_M1, setRecall_M1] = useState(0);
  const [Recall_M2, setRecall_M2] = useState(0);
  const [precision_M1, setPrecision_M1] = useState(0);
  const [precision_M2, setPrecision_M2] = useState(0);
  const [labelsForGraph, setLabels] = useState([]);
  const [mAPM1Graph, setmAPGraphM1] = useState([]);
  const [mAPM2Graph, setmAPGraphM2] = useState([]);

  ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
  );

  //When a project is selected
  useEffect(() => {
    if(selectedProject){
      const url = `http://127.0.0.1:8000/get_models_by_project/${selectedProject._id}`;
      axios
        .get(url, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        .then((res) => {
          setModels(res.data);
        });
    } else{
      setModels("")
    }
    setmAP50_M1(0)
    setmAP50_M2(0)
    setmAP90_M1(0)
    setmAP90_M2(0)
    setRecall_M1(0)
    setRecall_M2(0)
    setPrecision_M1(0)
    setPrecision_M2(0)
    setSelectedModel1('')
    setSelectedModel2('')
    setCSVDataModel1('')
    setCSVDataModel2('')
    setLabels([])
  },[selectedProject])

  //When selectedModel1 changed
  useEffect(() => {
    if (selectedModel1) {
      const pathToCsv = selectedModel1.path;
      const normalizedPath = pathToCsv.replace(/\\/g, '/');
      const desiredPath = normalizedPath.replace(/\/weights\/[^/]+$/, '') + "/results.csv";
      axios.post(`http://127.0.0.1:8000/get_csv`,{path: desiredPath}).then(
        (res) =>{
          console.log(res.data)
          if (res.data){
            setCSVDataModel1(res.data)
          } else{
            alert("There is no CSV for this model! Please upload one in the project!");
            setmAP50_M1(0)
            setmAP90_M1(0)
            setRecall_M1(0)
            setPrecision_M1(0)
            setmAPGraphM1([])
          }
        }
      )
    }
  }, [selectedModel1]);

  //When selectedModel2 changed
  useEffect(() => {
    if (selectedModel2) {
      const pathToCsv = selectedModel2.path;
      const normalizedPath = pathToCsv.replace(/\\/g, '/');
      const desiredPath = normalizedPath.replace(/\/weights\/[^/]+$/, '') + "/results.csv";
      axios.post(`http://127.0.0.1:8000/get_csv`,{path: desiredPath}).then(
        (res) =>{
          if (res.data){
            setCSVDataModel2(res.data)
          } else{
            alert("There is no CSV for this model! Please upload one in the project!");
            setmAP50_M2(0)
            setmAP90_M2(0)
            setRecall_M2(0)
            setPrecision_M2(0)
            setmAPGraphM2([])
          }
        }
      )
    }
  },[selectedModel2])

  //CSV Data from model1
  useEffect(() => {
    if(csvDataModel1){
      if(csvDataModel1[csvDataModel1.length-1]){
        let keys = Object.keys(csvDataModel1[csvDataModel1.length-1])
        console.log(keys[0])
        let mAP50 = csvDataModel1[csvDataModel1.length-1][keys[6]]
        setmAP50_M1(mAP50)
        let mAPGraphM1 = [];
        for (let i = 0; i < csvDataModel1.length; i++) {
          const entry = csvDataModel1[i];
          const mAP50 = entry[keys[6]];
          mAPGraphM1.push(mAP50);
        }
        setmAPGraphM1(mAPGraphM1);
        let mAP90 = csvDataModel1[csvDataModel1.length-1][keys[7]]
        setmAP90_M1(mAP90)
        let recall = csvDataModel1[csvDataModel1.length-1][keys[5]]
        setRecall_M1(recall)
        let precision = csvDataModel1[csvDataModel1.length-1][keys[4]]
        setPrecision_M1(precision)
        if (csvDataModel1[csvDataModel1.length - 1][keys[0]]) {
          const numEpochs = parseInt(csvDataModel1[csvDataModel1.length - 1][keys[0]], 10);
          setLabels(Array.from({ length: numEpochs+1  }, (_, index) => index.toString()));
        }
      }
    }
    }
  ,[csvDataModel1])

  //CSV Data from model2
  useEffect(() => {
    if(csvDataModel2){
      if(csvDataModel2[csvDataModel2.length-1]){
        let keys = Object.keys(csvDataModel2[csvDataModel2.length-1])
        let mAP50 = csvDataModel2[csvDataModel2.length-1][keys[6]]
        setmAP50_M2(mAP50)
        let mAPGraphM2 = [];
        for (let i = 0; i < csvDataModel2.length; i++) {
          const entry = csvDataModel2[i];
          const mAP50 = entry[keys[6]];
          mAPGraphM2.push(mAP50);
        }
        setmAPGraphM2(mAPGraphM2);
        let mAP90 = csvDataModel2[csvDataModel2.length-1][keys[7]]
        setmAP90_M2(mAP90)
        let recall = csvDataModel2[csvDataModel2.length-1][keys[5]]
        setRecall_M2(recall)
        let precision = csvDataModel2[csvDataModel2.length-1][keys[4]]
        setPrecision_M2(precision)
        if (csvDataModel2[csvDataModel2.length - 1][keys[0]]) {
          const numEpochs = parseInt(csvDataModel2[csvDataModel2.length - 1][keys[0]], 10);
          setLabels(Array.from({ length: numEpochs +1  }, (_, index) => index.toString()));
        }
      }
    }
  },[csvDataModel2])

  useEffect(() => {
    console.log(labelsForGraph)
  },[labelsForGraph])

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: {
            size: 12, // Decrease legend font size
          },
        },
      },
      title: {
        display: true,
        text: 'Example',
        font: {
          size: 18, // Decrease title font size
        },
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Epochs',
        },
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'mAP50',
        },
      },
    },
  };

  const data = {
    labels: labelsForGraph.length > 0 ? labelsForGraph : ["No data available"],
    datasets: [
      {
        label:  selectedModel1 && selectedModel1.name !== "None" ? selectedModel1.name : "",
        data: labelsForGraph.length > 0 ? mAPM1Graph : [],
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      },
      {
        label: selectedModel2 && selectedModel2.name !== "None" ? selectedModel2.name : "",
        data: labelsForGraph.length > 0 ? mAPM2Graph : [],
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      },
    ],
  };


  const metrics = [
    {
      cardTitle: 'mAP50',
      data: [
        {
          label: selectedModel1 ? selectedModel1.name : "None",
          value: mAP50_M1 ? mAP50_M1 : 0,
        },
        {
          label: selectedModel2 ? selectedModel2.name : "None",
          value: mAP50_M2 ? mAP50_M2 : 0,
        },
      ],
    },
    {
      cardTitle: 'mAP90',
      data: [
        {
          label: selectedModel1 ? selectedModel1.name : "None",
          value: mAP90_M1 ? mAP90_M1 : 0,
        },
        {
          label: selectedModel2 ? selectedModel2.name : "None",
          value: mAP90_M2 ? mAP90_M2 : 0,
        },
      ],
    },
    {
      cardTitle: 'Recall',
      data: [
        {
          label: selectedModel1 ? selectedModel1.name : "None",
          value: Recall_M1 ? Recall_M1 : 0,
        },
        {
          label: selectedModel2 ? selectedModel2.name : "None",
          value: Recall_M2 ? Recall_M2 : 0,
        },
        // Add more metrics here
      ],
    },
    {
      cardTitle: 'Precision',
      data: [
        {
          label: selectedModel1 ? selectedModel1.name : "None",
          value: precision_M1 ? precision_M1 : 0,
        },
        {
          label: selectedModel2 ? selectedModel2.name : "None",
          value: precision_M2 ? precision_M2 : 0,
        },
        // Add more metrics here
      ],
    },
  ];

  const handleProjectChange = (e) => {
    const projectId = e.target.value;
    const selectedProject = projects.find((project) => project._id === projectId);
    setSelectedProject(selectedProject);
  };

  const handleModel1Change = (e) => {
    const modelID = e.target.value;
    const selectedModel = models.find((model) => model._id === modelID)
    setSelectedModel1(selectedModel);
  };

  const handleModel2Change = (e) => {
    const modelID = e.target.value;
    const selectedModel = models.find((model) => model._id === modelID)
    setSelectedModel2(selectedModel);
  };

  return (
    <div className='scrollable-container'>
      <div className="container mt-4">
        <div className="row justify-content-center mb-4">
          <div className="col-lg-6 col-md-8">
            <div className="input-group">
              <select
                className="form-select"
                value={selectedProject ? selectedProject.id : ''}
                onChange={handleProjectChange}
              >
                <option value="test">Select Project</option>
                {projects.map((project) => (
                <option value={project._id} key={project._id}>{project.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="row justify-content-center mb-4">
          <div className="col-lg-6 col-md-8">
            <div className="input-group">
              <select
                className="form-select me-2"
                value={selectedModel1 ? selectedModel1._id : ''}
                onChange={handleModel1Change}
              >
                <option value="">Select Model 1</option>
                {models.length > 0 ? (
                  models.map((model) => (
                    <option value={model._id} key={model._id}>
                      {model.name}
                    </option>
                  ))
                ) : (
                  <option disabled>No models available</option>
                )}
              </select>
              <span className="input-group-text">&rarr;</span>
              <select
                className="form-select ms-2"
                value={selectedModel2 ? selectedModel2._id : ''}
                onChange={handleModel2Change}
              >
                <option value="">Select Model 2</option>
                {models.length > 0 ? (
                  models.map((model) => (
                    <option value={model._id} key={model._id}>
                      {model.name}
                    </option>
                  ))
                ) : (
                  <option disabled>No models available</option>
                )}
              </select>
            </div>
          </div>
        </div>

        <div className="row justify-content-center mb-4">
          <div className="col-lg-6 col-md-8">
            <div className="card bg-light">
            <div className="card-header">
                <h4 className="card-title">Graph</h4>
              </div>
              <div className="card-body">
                <Line options={options} data={data} height={200} />
              </div>
            </div>
          </div>
        </div>

        <div className="row justify-content-center">
          <div className="col-lg-6 col-md-8">
            <div className="card bg-light">
            <div className="card-header">
                <h4 className="card-title">Metrics</h4>
              </div>
              <div className="card-body d-flex flex-row flex-wrap overflow-auto" style={{ maxHeight: '300px' }}>
                {metrics.map((metricGroup, groupIndex) => (
                  <div key={groupIndex} className="card m-2" style={{ width: '130px' }}>
                    <div className="card-body">
                      <h5 className="card-title mb-3" style={{ fontSize: '1rem' }}>
                        {metricGroup.cardTitle}
                      </h5>
                      {metricGroup.data.map((metric, metricIndex) => (
                        <div key={metricIndex}>
                          <h6 className="card-subtitle mb-2 text-muted" style={{ fontSize: '0.8rem' }}>
                            {metric.label}
                          </h6>
                          <p className="card-text" style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                            {metric.value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Statistics;
