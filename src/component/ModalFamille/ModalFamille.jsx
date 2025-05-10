import React from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css'; // ajoute cette ligne pour inclure le CSS de Bootstrap


const ModalFamille = ({ show, onClose }) => {
  return (
    <Modal show={show} onHide={onClose}>
      <Modal.Header closeButton>
        <Modal.Title>Informations Membres de Famille</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Nom et Prénom Conjointe</Form.Label>
            <Form.Control type="text" placeholder="Nom et Prénom de la conjointe" />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Adresse Conjointe</Form.Label>
            <Form.Control type="text" placeholder="Adresse" />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Téléphone Conjointe</Form.Label>
            <Form.Control type="text" placeholder="Téléphone" />
          </Form.Group>

          <hr />

          <Form.Group className="mb-3">
            <Form.Label>Nom et Prénom Père</Form.Label>
            <Form.Control type="text" placeholder="Nom et Prénom du père" />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Adresse Père</Form.Label>
            <Form.Control type="text" placeholder="Adresse du père" />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Téléphone Père</Form.Label>
            <Form.Control type="text" placeholder="Téléphone du père" />
          </Form.Group>

          <hr />

          <Form.Group className="mb-3">
            <Form.Label>Nom et Prénom Mère</Form.Label>
            <Form.Control type="text" placeholder="Nom et Prénom de la mère" />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Adresse Mère</Form.Label>
            <Form.Control type="text" placeholder="Adresse de la mère" />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Téléphone Mère</Form.Label>
            <Form.Control type="text" placeholder="Téléphone de la mère" />
          </Form.Group>

          <hr />

          <Form.Group className="mb-3">
            <Form.Label>Personne à contacter (Nom)</Form.Label>
            <Form.Control type="text" placeholder="Nom" />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Adresse Personne à Contacter</Form.Label>
            <Form.Control type="text" placeholder="Adresse" />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Téléphone Personne à Contacter</Form.Label>
            <Form.Control type="text" placeholder="Téléphone" />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Fermer
        </Button>
        <Button variant="primary" onClick={onClose}>
          Enregistrer
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ModalFamille;
