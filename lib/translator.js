export default function translateSpanish(msg) {
  if (msg.includes('Email not confirmed')) return 'Debes confirmar tu correo electrónico antes de continuar.';
  if (msg.includes('User already registered')) return 'Este usuario ya se encuentra registrado.';
  if (msg.includes('Unable to validate email address: invalid format')) return 'Por favor, ingresa un correo electrónico válido.';
  if (msg.includes('Password should be at least 6 characters')) return 'La contraseña debe tener al menos 6 caracteres.';
  if (msg.includes('Invalid login credentials')) return 'Credenciales no validas.';
  if (msg.includes('You have successfully logged in!')) return 'Bienvienido de vuelta!';
  return msg;
}
