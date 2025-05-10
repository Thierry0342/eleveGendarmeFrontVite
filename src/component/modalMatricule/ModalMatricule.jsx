import React from 'react';
import { Modal, Button, Form } from 'react-bootstrap';

const ModalMatricule = ({ show, onClose, matricule, onChange, onSubmit }) => {
  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Modifier le matricule</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group controlId="formMatricule">
            <Form.Label>Nouveau matricule</Form.Label>
            <Form.Control
              type="text"
              value={matricule}
              onChange={(e) => onChange(e.target.value)}
            />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Annuler
        </Button>
        <Button variant="primary" onClick={onSubmit}>
          Modifier
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ModalMatricule;
