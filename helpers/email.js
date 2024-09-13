const dotenv = require('dotenv');
const path = require('path');

// import SibApiV3Sdk from '@sendinblue/client';
const SibApiV3Sdk = require('sib-api-v3-sdk');

dotenv.config({ path: path.join(__dirname, 'variables.env') });


// Configurar Sendinblue (Brevo)

const enviarEmail = async (de, to, nombre, subject, textContent, htmlContent) => {

    // Crea una instancia de la API de correos transaccionales de Sendinblue (Brevo)
    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

    const apiKey = process.env.API_KEY;

    // Configura la autenticación de la API con la clave API
    let defaultClient = SibApiV3Sdk.ApiClient.instance;
    let apiKeyInstance = defaultClient.authentications['api-key'];
    apiKeyInstance.apiKey = apiKey;


    // Crea un objeto de correo electrónico con los detalles del correo
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

    sendSmtpEmail.to = [{ email: to }]; // Establece el destinatario del correo
    sendSmtpEmail.sender = { email: de, name: nombre }; // Establece el remitente del correo
    sendSmtpEmail.subject = subject;  // Establece el asunto del correo
    sendSmtpEmail.textContent = textContent; // Establece el contenido en texto plano del correo
    sendSmtpEmail.htmlContent = htmlContent; // Establece el contenido en HTML del correo

    try {

        // Envía el correo electrónico utilizando la API de Sendinblue
        const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
        return data; // Devuelve los datos de la respuesta si el envío es exitoso

    } catch (error) {
        
        // Lanza un error si ocurre un problema durante el envío del correo
        throw error;
    }
};

module.exports = {enviarEmail}