'use client';

import { useState } from 'react';

interface MessageTemplate {
  id: string;
  label: string;
  type: 'missed-pickup' | 'meeting' | 'property-manager' | 'general';
  template: string;
  requiresAddress?: boolean;
  requiresCustomer?: boolean;
}

const MESSAGE_TEMPLATES: MessageTemplate[] = [
  {
    id: 'missed-pickup',
    label: '🚛 Missed Pick-up',
    type: 'missed-pickup',
    template: 'Missed pick-up reported at {address}',
    requiresAddress: true,
    requiresCustomer: true,
  },
  {
    id: 'meeting',
    label: '🗓️ Meeting Announcement',
    type: 'meeting',
    template: 'Team meeting scheduled for {time}',
  },
  {
    id: 'property-manager',
    label: '🧑‍💼 Property Manager Update',
    type: 'property-manager',
    template: 'Property manager message: {message}',
  },
  {
    id: 'general',
    label: '📢 General Alert',
    type: 'general',
    template: '{message}',
  },
];

interface ChatMessageSenderProps {
  onClose?: () => void;
}

export default function ChatMessageSender({ onClose }: ChatMessageSenderProps) {
  const [message, setMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [address, setAddress] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const handleTemplateSelect = (template: MessageTemplate) => {
    setSelectedTemplate(template);
    setMessage(template.template);
    setFeedback(null);
  };

  const handleSendMessage = async () => {
    if (!message.trim()) {
      setFeedback({
        type: 'error',
        message: 'Please enter a message',
      });
      return;
    }

    if (selectedTemplate?.requiresAddress && !address.trim()) {
      setFeedback({
        type: 'error',
        message: 'Address is required for this message type',
      });
      return;
    }

    setIsLoading(true);
    setFeedback(null);

    try {
      // Replace template variables
      let finalMessage = message;
      if (address) {
        finalMessage = finalMessage.replace('{address}', address);
      }
      if (customerName) {
        finalMessage = finalMessage.replace('{customer}', customerName);
      }
      finalMessage = finalMessage.replace('{time}', new Date().toLocaleString());
      finalMessage = finalMessage.replace('{message}', message);

      const response = await fetch('/api/send-chat-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: finalMessage,
          type: selectedTemplate?.type,
          address: address || undefined,
          customerName: customerName || undefined,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setFeedback({
          type: 'success',
          message: 'Message sent successfully! 🎉',
        });
        setMessage('');
        setAddress('');
        setCustomerName('');
        setSelectedTemplate(null);
      } else {
        setFeedback({
          type: 'error',
          message: result.error || 'Failed to send message',
        });
      }
    } catch (error) {
      setFeedback({
        type: 'error',
        message: 'Network error. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearForm = () => {
    setMessage('');
    setAddress('');
    setCustomerName('');
    setSelectedTemplate(null);
    setFeedback(null);
  };

  return (
    <div className="chat-message-sender">
      <div className="sender-header">
        <h3>📣 Company Alerts</h3>
        {onClose && (
          <button onClick={onClose} className="close-button">
            ×
          </button>
        )}
      </div>

      {/* Message Templates */}
      <div className="template-section">
        <label className="section-label">Quick Templates:</label>
        <div className="template-buttons">
          {MESSAGE_TEMPLATES.map((template) => (
            <button
              key={template.id}
              onClick={() => handleTemplateSelect(template)}
              className={`template-button ${
                selectedTemplate?.id === template.id ? 'active' : ''
              }`}
            >
              {template.label}
            </button>
          ))}
        </div>
      </div>

      {/* Additional Fields */}
      {selectedTemplate?.requiresAddress && (
        <div className="input-group">
          <label htmlFor="address">Address:</label>
          <input
            id="address"
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter customer address..."
            className="address-input"
          />
        </div>
      )}

      {selectedTemplate?.requiresCustomer && (
        <div className="input-group">
          <label htmlFor="customer">Customer Name (optional):</label>
          <input
            id="customer"
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Enter customer name..."
            className="customer-input"
          />
        </div>
      )}

      {/* Message Input */}
      <div className="input-group">
        <label htmlFor="message">Message:</label>
        <textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message here..."
          className="message-input"
          rows={4}
        />
      </div>

      {/* Action Buttons */}
      <div className="action-buttons">
        <button
          onClick={clearForm}
          className="clear-button"
          disabled={isLoading}
        >
          Clear
        </button>
        <button
          onClick={handleSendMessage}
          className="send-button"
          disabled={isLoading || !message.trim()}
        >
          {isLoading ? 'Sending...' : 'Send Message 📤'}
        </button>
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={`feedback ${feedback.type}`}>
          {feedback.message}
        </div>
      )}
    </div>
  );
} 