import React, { useState, useEffect} from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import axios from 'axios'

const Popup = (props) => {
  const [show, setShow] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    setShow(props.show)
  },[props.show])

  const handleClose = () => {
    setShow(false);
    props.handleTogglePopup()
  }

  const handleSubmit = (name, description) => {
    setShow(false);
    props.handleTogglePopup()
    axios.post("http://127.0.0.1:8000/create_project",{
      name: name,
      description: description
    } ,{
      headers: { Authorization: `Bearer ${props.access_token}` },
      })
  }

  const handleShow = () => setShow(true);


  return(
    <>
      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Add Project</Modal.Title>
        </Modal.Header>
        <Modal.Body>          <Form.Group controlId="name">
            <Form.Label>Name:</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Form.Group>
          <Form.Group controlId="description">
            <Form.Label>Description:</Form.Label>
            <Form.Control
              as="textarea"
              placeholder="Enter description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Form.Group></Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="danger" onClick={()=> handleSubmit(name, description)}>
            Submit
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}

export default Popup