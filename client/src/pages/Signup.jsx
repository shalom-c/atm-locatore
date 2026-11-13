import { useState } from 'react';
import { deleteUser, sendEmailVerification, updateProfile } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout.jsx';
import { db } from '../lib/firebase.js';
import { getAuthErrorMessage, signUp } from '../lib/auth.js';

const INITIAL_VALUES = {
  firstName: '',
  middleName: '',
  lastName: '',
  email: '',
  phone: '',
  nin: '',
  password: '',
  confirmPassword: '',
};

function validate(values) {
  const errors = {};
  const firstName = values.firstName.trim();
  const lastName = values.lastName.trim();
  const email = values.email.trim();
  const phone = values.phone.trim();

  if (firstName.length < 2 || firstName.length > 50) {
    errors.firstName = 'First name must be 2–50 characters.';
  }
  if (lastName.length < 2 || lastName.length > 50) {
    errors.lastName = 'Last name must be 2–50 characters.';
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Enter a valid email address.';
  }
  if (!/^(0\d{10}|\+234\d{10})$/.test(phone)) {
    errors.phone = 'Enter 0XXXXXXXXXX or +234XXXXXXXXXX.';
  }
  if (!/^\d{11}$/.test(values.nin)) {
    errors.nin = 'NIN must be 11 digits';
  }
  if (values.password.length < 8) {
    errors.password = 'Password must be at least 8 characters.';
  }
  if (values.password !== values.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.';
  }

  return errors;
}

function normalizedPhone(phone) {
  return phone.startsWith('0') ? `+234${phone.slice(1)}` : phone;
}

export default function Signup() {
  const [values, setValues] = useState(INITIAL_VALUES);
  const [errors, setErrors] = useState({});
  const [requestError, setRequestError] = useState('');
  const [pending, setPending] = useState(false);
  const navigate = useNavigate();

  function updateField(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' }));
    setRequestError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const validationErrors = validate(values);
    setErrors(validationErrors);
    setRequestError('');
    if (Object.keys(validationErrors).length > 0) return;

    setPending(true);
    let newUser;
    try {
      const credential = await signUp(values.email.trim(), values.password);
      newUser = credential.user;
      const displayName = `${values.firstName.trim()} ${values.lastName.trim()}`;
      await updateProfile(newUser, { displayName });

      try {
        await setDoc(doc(db, 'users', newUser.uid), {
          firstName: values.firstName.trim(),
          middleName: values.middleName.trim(),
          lastName: values.lastName.trim(),
          email: values.email.trim(),
          phone: normalizedPhone(values.phone.trim()),
          nin: values.nin,
          displayName,
          role: 'user',
          createdAt: serverTimestamp(),
        });
      } catch (writeError) {
        try {
          // Remove the Auth account too, so a failed profile write cannot leave an unusable login behind.
          await deleteUser(newUser);
        } catch (cleanupError) {
          throw new Error(
            `Saving your account profile failed: ${getAuthErrorMessage(writeError)}. Account cleanup also failed: ${getAuthErrorMessage(cleanupError)}`,
          );
        }
        throw writeError;
      }

      try {
        await sendEmailVerification(newUser);
      } catch {
        // Verification email delivery is best-effort and must not block signup.
      }

      navigate('/', { replace: true });
    } catch (error) {
      setRequestError(getAuthErrorMessage(error));
      setPending(false);
    }
  }

  const fields = [
    { name: 'firstName', label: 'First name', autoComplete: 'given-name' },
    { name: 'middleName', label: 'Middle name (optional)', autoComplete: 'additional-name' },
    { name: 'lastName', label: 'Last name', autoComplete: 'family-name' },
    { name: 'email', label: 'Email', type: 'email', autoComplete: 'email' },
    { name: 'phone', label: 'Phone number', type: 'tel', autoComplete: 'tel' },
    { name: 'nin', label: 'National Identification Number (NIN)', inputMode: 'numeric', maxLength: 11 },
    { name: 'password', label: 'Password', type: 'password', autoComplete: 'new-password' },
    { name: 'confirmPassword', label: 'Confirm password', type: 'password', autoComplete: 'new-password' },
  ];

  return (
    <AuthLayout
      title="Create your account"
      description="Sign up to find ATMs near you."
      footer={<>Already have an account? <Link to="/login">Log in</Link></>}
    >
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {fields.map((field) => {
          const type = field.type || 'text';
          const errorId = `${field.name}-error`;
          return (
            <div className="auth-field" key={field.name}>
              <label htmlFor={field.name}>{field.label}</label>
              <input
                id={field.name}
                name={field.name}
                type={type}
                value={values[field.name]}
                onChange={updateField}
                autoComplete={field.autoComplete}
                inputMode={field.inputMode}
                maxLength={field.maxLength}
                aria-invalid={Boolean(errors[field.name])}
                aria-describedby={errors[field.name] ? errorId : undefined}
                required={field.name !== 'middleName'}
              />
              {errors[field.name] && <p className="field-error" id={errorId}>{errors[field.name]}</p>}
            </div>
          );
        })}
        {requestError && <p className="form-error" role="alert">{requestError}</p>}
        <button className="button button-primary auth-submit" type="submit" disabled={pending}>
          {pending ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </AuthLayout>
  );
}
