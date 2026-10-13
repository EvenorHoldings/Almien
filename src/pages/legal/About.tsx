import LegalLayout from './LegalLayout';

export default function About() {
  return (
    <LegalLayout title="About Almien">
      <p>Almien ("Always Near") is a personal safety companion for Cape Town and the Western Cape. It brings together crime statistics, live alerts, safe-route planning, load-shedding and utility status, emergency contacts and community reports in one place.</p>
      <h2>What Almien is not</h2>
      <p>Almien is an information tool. It is not an emergency service. In an emergency call SAPS on 10111, or 112 from a mobile phone.</p>
      <h2>Data sources</h2>
      <p>Almien uses public data from sources such as the South African Police Service, the City of Cape Town, the Western Cape Government, ACSA and OpenStreetMap contributors, together with reports from the community. Some data may be delayed, estimated or incomplete.</p>
      <h2>Contact</h2>
      <p>For questions or feedback, use the contact options in the app's Settings.</p>
    </LegalLayout>
  );
}
