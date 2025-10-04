import { Input } from './input';
import { useState, useEffect } from 'react';

interface RegistrationInputProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  required?: boolean;
}

export function RegistrationInput({ value, onChange, id, required }: RegistrationInputProps) {
  const [displayValue, setDisplayValue] = useState('EBSU/');

  useEffect(() => {
    if (value) {
      // Format: EBSU/XXXX/YYYYY-YYYYYYYYY (5-9 digits after first 4)
      const cleaned = value.replace(/[^0-9]/g, '');
      if (cleaned.length <= 4) {
        setDisplayValue(`EBSU/${cleaned}`);
      } else {
        setDisplayValue(`EBSU/${cleaned.slice(0, 4)}/${cleaned.slice(4)}`);
      }
    } else {
      setDisplayValue('EBSU/');
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value;
    
    // Remove EBSU/ prefix for processing
    if (input.startsWith('EBSU/')) {
      input = input.slice(5);
    }
    
    // Remove all non-numeric characters
    const cleaned = input.replace(/[^0-9]/g, '');
    
    // Limit to 13 digits total (4 + up to 9 after first 4)
    const limited = cleaned.slice(0, 13);
    
    onChange(limited);
  };

  return (
    <Input
      id={id}
      type="text"
      value={displayValue}
      onChange={handleChange}
      placeholder="EBSU/1234/56789"
      required={required}
      maxLength={20} // EBSU/ + 4 digits + / + 5-9 digits
    />
  );
}
