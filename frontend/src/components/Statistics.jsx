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
  const [selectedModel2, setSelectedModel2] = useState('');
  const [selectedProject, setSelectedProject] = useState({});
  const [models, setModels] = useState({});

  ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
  );

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
  },[selectedProject])

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
      y: {
        ticks: {
          font: {
            size: 12, // Decrease y-axis label font size
          },
        },
      },
    },
  };

  const labels = ['January', 'February', 'March', 'April', 'May', 'June', 'July'];

  const data = {
    labels,
    datasets: [
      {
        label: 'Dataset 1',
        data: labels.map(() => faker.number.int({ min: -1000, max: 1000 })),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      },
      {
        label: 'Dataset 2',
        data: labels.map(() => faker.number.int({ min: -1000, max: 1000 })),
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
          label: 'Accuracy Before',
          value: 0.75,
        },
        {
          label: 'Accuracy Now',
          value: 0.9,
        },
      ],
    },
    {
      cardTitle: 'mAP90',
      data: [
        {
          label: 'Accuracy Before',
          value: 0.75,
        },
        {
          label: 'Accuracy Now',
          value: 0.9,
        },
      ],
    },
    {
      cardTitle: 'Recall',
      data: [
        {
          label: 'Metric 1',
          value: 0.85,
        },
        {
          label: 'Metric 2',
          value: 0.95,
        },
        // Add more metrics here
      ],
    },
    {
      cardTitle: 'Precision',
      data: [
        {
          label: 'Metric 1',
          value: 0.85,
        },
        {
          label: 'Metric 2',
          value: 0.95,
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
