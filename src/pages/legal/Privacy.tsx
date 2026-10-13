import LegalLayout from './LegalLayout';

export default function Privacy() {
  return (
    <LegalLayout title="Privacy Policy" updated="13 October 2026">
      <p>This policy explains how Almien collects and uses personal information, in line with the Protection of Personal Information Act, 2013 (POPIA).</p>
      <h2>Information we collect</h2>
      <ul>
        <li>Account details you give us, such as your email address and profile information.</li>
        <li>Your location, only when you allow it, to show nearby safety information and routes.</li>
        <li>Reports, emergency contacts and saved places you choose to submit or store.</li>
        <li>Basic technical and usage data needed to run and secure the service.</li>
      </ul>
      <h2>How we use it</h2>
      <p>We use this information to provide safety features, send alerts you have asked for, improve the service and keep it secure. We do not sell your personal information.</p>
      <h2>Sharing</h2>
      <p>We share information only with service providers that host and operate Almien on our behalf, with emergency responders when you trigger an SOS or dispatch feature, or when the law requires it.</p>
      <h2>Your rights</h2>
      <p>You can ask to see, correct or delete your personal information, and you can withdraw location permission at any time in your device settings.</p>
    </LegalLayout>
  );
}
