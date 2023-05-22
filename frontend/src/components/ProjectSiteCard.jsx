import React from 'react';
import "./ProjectSiteCardStyle.css"

const ProjectSiteCard = ({ data, type }) => {
  let imageSrc;

  // Determine the image source based on the type
  if (type === 'images') {
    imageSrc = "/" + data.name;
    console.log(imageSrc)
  } else if (type === 'annotations') {
    imageSrc = '/txt.png'; // Replace with the actual image path for annotations
  } else if (type === 'models') {
    imageSrc = '/model.png'; // Replace with the actual image path for models
  }

  return (
    <div className="project-site-card">
      <img  src={imageSrc} />
      <div className="card-text"><a href="#">{data.name}</a></div>
    </div>
  );
};

export default ProjectSiteCard;
