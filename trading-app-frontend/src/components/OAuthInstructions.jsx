import { Alert } from 'react-bootstrap';

const OAuthInstructions = () => {
  return (
    <Alert variant="info" className="mt-3">
      <Alert.Heading>OAuth Authentication Note</Alert.Heading>
      <p className="mb-2">
        After clicking "Continue with Google", you will:
      </p>
      <ol className="mb-0">
        <li>Be redirected to Google for authentication</li>
        <li>See a "Powered by Appwrite" page after login</li>
        <li><strong>Click "Continue to Trading Post" or wait 5 seconds for auto-redirect</strong></li>
      </ol>
      <hr />
      <p className="mb-0 small">
        <em>We&apos;re working on improving this flow. The app will automatically detect when you&apos;ve logged in.</em>
      </p>
    </Alert>
  );
};

export default OAuthInstructions;