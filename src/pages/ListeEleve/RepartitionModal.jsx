// Dans ListeElevePge.jsx (ou séparément : RepartitionModal.jsx)

import React, { useState } from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';
import Swal from 'sweetalert2';

export default function RepartitionModal({ show, onHide, onConfirm }) {
  const [cards, setCards] = useState([{ numero: '', capacite: '' }]);

  const addCard = () => {
    setCards([...cards, { numero: '', capacite: '' }]);
  };
  const removeCard = idx => {
    setCards(cards.filter((_, i) => i !== idx));
  };
  const updateCard = (idx, field, value) => {
    const nc = [...cards];
    nc[idx][field] = value;
    setCards(nc);
  };

  const handleSubmit = () => {
    // Validation basique
    for (const { numero, capacite } of cards) {
      if (!numero || !capacite || isNaN(capacite) || capacite <= 0) {
        Swal.fire('Erreur', 'Numéro et capacité valides requis pour chaque salle', 'error');
        return;
      }
    }
    onConfirm(cards.map(c => ({ numero: Number(c.numero), capacite: Number(c.capacite) })));
    onHide();
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Définir les salles</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {cards.map((card, i) => (
          <Row key={i} className="align-items-center mb-2">
            <Col>
              <Form.Control
                type="number"
                placeholder="Numéro de salle"
                value={card.numero}
                onChange={e => updateCard(i, 'numero', e.target.value)}
              />
            </Col>
            <Col>
              <Form.Control
                type="number"
                placeholder="Capacité"
                value={card.capacite}
                onChange={e => updateCard(i, 'capacite', e.target.value)}
              />
            </Col>
            <Col xs="auto">
              {cards.length > 1 && (
                <Button variant="outline-danger" onClick={() => removeCard(i)}>
                  &times;
                </Button>
              )}
            </Col>
          </Row>
        ))}
        <Button variant="outline-primary" onClick={addCard}>
          + Ajouter une salle
        </Button>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Annuler
        </Button>
        <Button variant="primary" onClick={handleSubmit}>
          Valider
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
