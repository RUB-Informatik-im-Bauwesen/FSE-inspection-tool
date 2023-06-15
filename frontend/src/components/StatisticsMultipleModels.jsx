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

const StatisticsMultipleModels = ({accessToken, projects}) => {
  const [selectedModels, setSelectedModels] = useState([]);
  const [csvDataModel, setcsvDataModel] = useState([]);
  const [selectedProject, setSelectedProject] = useState([]);
  const [model, setModels] = useState([]);
  const [labelsForGraph, setLabels] = useState([]);
  const [dataForGraph, setDataForGraph] = useState({
    labels: "No data available",
    datasets: [],
  });
  const [metrics, setMetrics] = useState([]);
  const [deselectedBoolean, setDeselectedBoolean] = useState(false);

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
      setSelectedModels([]);
      setcsvDataModel([]);
      setLabels([]);
    },[selectedProject])

    //When new models were selected or deselected
    useEffect(() => {

      console.log("hello")
      if(selectedModels.length > 0 && !deselectedBoolean){
        const model = selectedModels[selectedModels.length-1]
        const pathToCsv = model.path;
        const normalizedPath = pathToCsv.replace(/\\/g, '/');
        const desiredPath = normalizedPath.replace(/\/weights\/[^/]+$/, '') + "/results.csv";
        axios.post(`http://127.0.0.1:8000/get_csv`,{path: desiredPath}).then(
        (res) =>{
          if (res.data){
            let keys = Object.keys(res.data[res.data.length-1])
            const mAP50CSV = res.data[res.data.length-1][keys[6]]
            let mAPForGraph = [];
            for (let i = 0; i < res.data.length; i++) {
              const entry = res.data[i];
              const mAP50CSV = entry[keys[6]];
              mAPForGraph.push(mAP50CSV);
            }
            const mAP90CSV = res.data[res.data.length-1][keys[7]]
            const recallCSV = res.data[res.data.length-1][keys[5]]
            const precisionCSV = res.data[res.data.length-1][keys[4]]
            let labelsCSV;
            if (res.data[res.data.length - 1][keys[0]]) {
              const numEpochs = parseInt(res.data[res.data.length - 1][keys[0]], 10);
              if(csvDataModel.every(model => mAPForGraph.length > model[4].length)){
                setLabels(Array.from({ length: numEpochs+1  }, (_, index) => index.toString()))
              }
            }
            setcsvDataModel([...csvDataModel,[mAP50CSV, mAP90CSV, recallCSV, precisionCSV, mAPForGraph, model._id]])
            } else{
            alert("There is no CSV for this model! Please upload one in the project!");
            }
          }
        )
      } else{
        setDeselectedBoolean(false);
      }

      console.log(selectedModels)
    },[selectedModels])

    useEffect(() => {
      setDataForGraph({
        labels: labelsForGraph.length > 0 ? labelsForGraph : ["No data available"],
        datasets: selectedModels && selectedModels.length > 0 ? selectedModels.map((model, index) => {
          const modelCsvData = csvDataModel.find((csvData) => csvData[5] === model._id);

          return {
            label: model.name !== "None" ? model.name : "",
            data: labelsForGraph.length > 0 && modelCsvData ? modelCsvData[4].map((value, i) => (i <= labelsForGraph.length - 1 ? value : null)) : [],
            borderColor: colorPalette[index % colorPalette.length],
            backgroundColor: `rgba(${parseInt(colorPalette[index % colorPalette.length].match(/\d+/g)[0], 10)}, ${parseInt(colorPalette[index % colorPalette.length].match(/\d+/g)[1], 10)}, ${parseInt(colorPalette[index % colorPalette.length].match(/\d+/g)[2], 10)}, 0.5)`,
          };
        }) : [],
      });


      setMetrics([
        {
          cardTitle: 'mAP50',
          data: selectedModels.map((model) => {
            const matchingEntry = csvDataModel.find((entry) => entry[5] === model._id);
            return {
              label: model.name !== "None" ? model.name : "None",
              value: matchingEntry ? matchingEntry[0] : 0,
            };
          }),
        },
        {
          cardTitle: 'mAP90',
          data: selectedModels.map((model) => {
            const matchingEntry = csvDataModel.find((entry) => entry[5] === model._id);
            return {
              label: model.name !== "None" ? model.name : "None",
              value: matchingEntry ? matchingEntry[1] : 0,
            };
          }),
        },
        {
          cardTitle: 'Recall',
          data: selectedModels.map((model) => {
            const matchingEntry = csvDataModel.find((entry) => entry[5] === model._id);
            return {
              label: model.name !== "None" ? model.name : "None",
              value: matchingEntry ? matchingEntry[2] : 0,
            };
          }),
        },
        {
          cardTitle: 'Precision',
          data: selectedModels.map((model) => {
            const matchingEntry = csvDataModel.find((entry) => entry[5] === model._id);
            return {
              label: model.name !== "None" ? model.name : "None",
              value: matchingEntry ? matchingEntry[3] : 0,
            };
          }),
        },
        // Add more metrics here
      ])

      console.log(csvDataModel)
    },[csvDataModel])

    useEffect(() => {
      console.log(metrics)
    },[metrics])

    useEffect(() => {
      console.log(dataForGraph)
    },[dataForGraph])

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
          text: 'mAP Comparison',
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

    const getRandomColorValue = () => {
      return Math.floor(Math.random() * 256);
    }

    const getColorByIndex = (index) => {
      const colorIndex = index % colorPalette.length;
      return colorPalette[colorIndex];
    };

    const colorPalette = [
      'rgb(255, 99, 132)',
      'rgb(54, 162, 235)',
      'rgb(255, 205, 86)',
      'rgb(75, 192, 192)',
      'rgb(153, 102, 255)',
      'rgb(255, 159, 64)',
      'rgb(255, 0, 0)',
      'rgb(0, 255, 0)',
      'rgb(0, 0, 255)',
      'rgb(128, 128, 128)',
    ];

    /*const data = {
      labels: labelsForGraph.length > 0 ? labelsForGraph : ["No data available"],
      datasets: selectedModels && selectedModels.length > 0 ? selectedModels.map((model, index) => ({
        label: model.name !== "None" ? model.name : "",
        data: labelsForGraph.length > 0  && csvDataModel[index][4] ? csvDataModel[index][4].map((value, i) => (i <= labelsForGraph.length - 1 ? value : null)) : [],
        borderColor: `rgb(${getRandomColorValue()}, ${getRandomColorValue()}, ${getRandomColorValue()})`,
        backgroundColor: `rgba(${getRandomColorValue()}, ${getRandomColorValue()}, ${getRandomColorValue()}, 0.5)`,
      })) : [],
    };*/


    /*const metrics = [
      {
        cardTitle: 'mAP50',
        data: selectedModels.map((model, index) => ({
          label: model.name !== "None" ? model.name : "None",
          value: 1//csvDataModel[index][0] || 0,
        })),
      },
      {
        cardTitle: 'mAP90',
        data: selectedModels.map((model, index) => ({
          label: model.name !== "None" ? model.name : "None",
          value: 1//csvDataModel[index][1] || 0,
        })),
      },
      {
        cardTitle: 'Recall',
        data: selectedModels.map((model, index) => ({
          label: model.name !== "None" ? model.name : "None",
          value: 1//csvDataModel[index][2] || 0,
        })),
      },
      {
        cardTitle: 'Precision',
        data: selectedModels.map((model, index) => ({
          label: model.name !== "None" ? model.name : "None",
          value: 1//csvDataModel[index][3] || 0,
        })),
      },
      // Add more metrics here
    ];*/

    const handleProjectChange = (e) => {
      if(e.target.value){
        const projectId = e.target.value;
        const selectedProject = projects.find((project) => project._id === projectId);
        setSelectedProject(selectedProject);
      }
    };

    const handleModelChange = (e) => {
      const modelID = e.target.value;
      const selectedModel = model.find((model) => model._id === modelID);

      if (selectedModel) {
        // Check if the model is already selected
        const isSelected = selectedModels.some((model) => model._id === selectedModel._id);

        if (isSelected) {
          // Model is already selected, remove it from the selected models
          setSelectedModels((prevSelectedModels) =>
            prevSelectedModels.filter((model) => model._id !== selectedModel._id)
          );

          setDeselectedBoolean(true);

          // Filter out the corresponding csvDataModel based on model id
            setcsvDataModel((prevCsvDataModel) =>
            prevCsvDataModel.filter((model) => model[5] !== selectedModel._id)
          );

        } else {
          // Model is not selected, add it to the selected models
          setSelectedModels((prevSelectedModels) => [...prevSelectedModels, selectedModel]);
        }
      }
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
                <option value="">Select Project</option>
                {projects.map((project) => (
                <option value={project._id} key={project._id}>{project.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Model Selection */}

        <div className="row justify-content-center mb-4">
          <div className="col-lg-6 col-md-8">
            <div className="input-group">
              {model.map((model) => (
                <div className="form-check" key={model._id}>
                  <input
                    className="form-check-input"
                    type="checkbox"
                    value={model._id}
                    defaultChecked={selectedModels.includes(model._id)}
                    onChange={handleModelChange}
                  />
                  <label className="form-check-label">{model.name}</label>
                </div>
              ))}
            </div>
          </div>
        </div>


        <div className="row justify-content-center mb-4">
          <div className="col-lg-6 col-md-8">
            <div className="card bg-light">
            <div className="card-header">
                <h4 className="card-title">Graph</h4>
              </div>
              <Line options={options} data={dataForGraph} height={200} />
              <div className="card-body">
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
  )
}

export default StatisticsMultipleModels