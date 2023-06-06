import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './FAQStyle.css'; // Import the custom CSS file

const FAQ = () => {
  const [activeCard, setActiveCard] = useState('');

  const handleCardToggle = (cardKey) => {
    setActiveCard(cardKey === activeCard ? '' : cardKey);
  };

  const renderFAQItems = () => {
    const faqItems = [
      {
        question: 'Can Projects have identical images?',
        answer: 'No, if an image is already in the project, it can not be uploaded twice.',
      },
      {
        question: 'Which active learning strategies are used in this web application?',
        answer: 'Two kind of strategies are used: If multiple models are uploaded, the active learning strategie will be based on the consensus score from Schmidt et al. If only one model is uploaded than the averaged confidence scores of each object are used to evaluate the informativeness of an image.',
      },
      {
        question: 'Test',
        answer: 'Two kind of strategies are used: If multiple models are uploaded, the active learning strategie will be based on the consensus score from Schmidt et al. If only one model is uploaded than the averaged confidence scores of each object are used to evaluate the informativeness of an image.',
      },
      {
        question: 'Test',
        answer: 'Two kind of strategies are used: If multiple models are uploaded, the active learning strategie will be based on the consensus score from Schmidt et al. If only one model is uploaded than the averaged confidence scores of each object are used to evaluate the informativeness of an image.',
      },
      {
        question: 'Test',
        answer: 'Two kind of strategies are used: If multiple models are uploaded, the active learning strategie will be based on the consensus score from Schmidt et al. If only one model is uploaded than the averaged confidence scores of each object are used to evaluate the informativeness of an image.',
      },
      {
        question: 'Test',
        answer: 'Two kind of strategies are used: If multiple models are uploaded, the active learning strategie will be based on the consensus score from Schmidt et al. If only one model is uploaded than the averaged confidence scores of each object are used to evaluate the informativeness of an image.',
      },
      {
        question: 'Test',
        answer: 'Two kind of strategies are used: If multiple models are uploaded, the active learning strategie will be based on the consensus score from Schmidt et al. If only one model is uploaded than the averaged confidence scores of each object are used to evaluate the informativeness of an image.',
      },
      {
        question: 'Test',
        answer: 'Two kind of strategies are used: If multiple models are uploaded, the active learning strategie will be based on the consensus score from Schmidt et al. If only one model is uploaded than the averaged confidence scores of each object are used to evaluate the informativeness of an image.',
      },
      // Add more question-answer pairs here
    ];

    return faqItems.map((item, index) => (
      <div key={index} className={`card ${activeCard === index.toString() ? 'active' : ''}`}>
        <div
          className="card-header"
          onClick={() => handleCardToggle(index.toString())}
        >
          <h5 className="card-title">{item.question}</h5>
        </div>
        {activeCard === index.toString() && (
          <div className="card-body">{item.answer}</div>
        )}
      </div>
    ));
  };

  return (
    <div className="container mt-4"> {/* Add margin top */}
      <div className="card text-left">
        <div className="card-header">
          <h2 className="card-title">FAQ</h2>
        </div>
        <div className="card-body">
          <div className="accordion">{renderFAQItems()}</div>
        </div>
      </div>
    </div>
  );
};

export default FAQ;
