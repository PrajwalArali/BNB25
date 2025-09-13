import React, { useState } from 'react';
import axios from 'axios';

const ValidationSection = () => {
  const [validationResult, setValidationResult] = useState(null);
  const [isValidating, setIsValidating] = useState(false);

  const validateLedger = async () => {
    setIsValidating(true);
    try {
      const response = await axios.get('/api/blockchain/validate');
      setValidationResult(response.data);
    } catch (error) {
      console.error('Error validating blockchain:', error);
      setValidationResult({ valid: false, message: 'Error validating blockchain' });
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="validation-section">
      <h2>Blockchain Integrity Check</h2>
      <button 
        onClick={validateLedger} 
        className="validate-btn"
        disabled={isValidating}
      >
        {isValidating ? 'Validating...' : 'Validate Blockchain'}
      </button>
      {validationResult && (
        <div className={`validation-result ${validationResult.valid ? 'valid' : 'invalid'}`}>
          <h3>Validation Result: {validationResult.valid ? 'VALID' : 'INVALID'}</h3>
          <p>{validationResult.message}</p>
        </div>
      )}
    </div>
  );
};

export default ValidationSection;