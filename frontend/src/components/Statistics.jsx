import React, { useState } from 'react';
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

const Statistics = () => {
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedModel, setSelectedModel] = useState('');

  ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
  );

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Chart.js Line Chart',
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
      cardTitle: 'Accuracy Metrics',
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
      cardTitle: 'Other Metrics',
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
    },{
      cardTitle: 'Other Metrics',
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
    setSelectedProject(e.target.value);
  };

  const handleModelChange = (e) => {
    setSelectedModel(e.target.value);
  };

  return (
    <div className="container mt-4">
      <div className="row justify-content-center mb-4">
        <div className="col-lg-6 col-md-8">
          <div className="input-group">
            <select
              className="form-select"
              value={selectedProject}
              onChange={handleProjectChange}
            >
              <option value="">Select Project</option>
              {/* Add options for projects dynamically */}
              <option value="project1">Project 1</option>
              <option value="project2">Project 2</option>
            </select>

            <select
              className="form-select"
              value={selectedModel}
              onChange={handleModelChange}
            >
              <option value="">Select Model</option>
              {/* Add options for models dynamically */}
              <option value="model1">Model 1</option>
              <option value="model2">Model 2</option>
            </select>
          </div>
        </div>
      </div>

      <div className="row justify-content-center mb-4">
        <div className="col-lg-6 col-md-8">
          <div className="card bg-light">
            <div className="card-body">
              <h4 className="card-title mb-3">Graphs</h4>
              <Line options={options} data={data} />
            </div>
          </div>
        </div>
      </div>

      <div className="row justify-content-center">
        <div className="col-lg-6 col-md-8">
          <div className="card bg-light">
            <div className="card-body d-flex flex-row flex-wrap overflow-auto" style={{ maxHeight: '400px' }}>
              {metrics.map((metricGroup, groupIndex) => (
                <div key={groupIndex} className="card m-2">
                  <div className="card-body">
                    <h5 className="card-title mb-3">{metricGroup.cardTitle}</h5>
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
  );
};

export default Statistics;
