module.exports = {
  INDUSTRIES: [
    'Real Estate',
    'Healthcare',
    'Hotel',
    'Restaurant',
    'Automobile',
    'Education',
    'Home Services',
    'Technology',
    'Legal',
    'Other'
  ],
  AGENT_TYPES: ['receptionist', 'sales', 'support', 'appointment_setter'],
  VOICE_STYLES: ['Friendly', 'Professional', 'Luxury', 'Energetic'],
  VOICE_GENDERS: ['Female', 'Male'],
  CALL_STATUSES: ['answered', 'missed', 'completed', 'transferred', 'failed'],
  LEAD_STAGES: ['NEW', 'CONTACTED', 'QUALIFIED', 'APPOINTMENT', 'PROPOSAL', 'WON', 'LOST'],
  APPOINTMENT_STATUSES: ['scheduled', 'completed', 'cancelled', 'rescheduled'],
  PLANS: [
    {
      id: 'starter',
      name: 'Starter',
      price: 99,
      minutes: 300,
      features: [
        '1 AI Receptionist',
        '300 Included Voice Minutes',
        'Standard Voice & Latency',
        'Lead Capture & Qualification',
        'Basic Appointment Booking',
        'Email Support'
      ]
    },
    {
      id: 'growth',
      name: 'Growth',
      price: 249,
      minutes: 1000,
      popular: true,
      features: [
        'Up to 3 AI Receptionists',
        '1,000 Included Voice Minutes',
        'Ultra-low Latency Voices',
        'Custom Knowledge Base & Docs',
        'Human Call Transfer Handoff',
        'CRM & Calendar Integrations',
        'Priority 24/7 Support'
      ]
    },
    {
      id: 'business',
      name: 'Business',
      price: 599,
      minutes: 3000,
      features: [
        'Unlimited AI Employees',
        '3,000 Included Voice Minutes',
        'Custom Voice Cloning Support',
        'Full Webhooks & REST API',
        'Advanced Analytics & Recordings',
        'Dedicated Account Manager'
      ]
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 1499,
      minutes: 10000,
      features: [
        'Custom Volume Minutes',
        'Private Cloud / On-Premise',
        'HIPAA & SOC-2 Compliance Ready',
        'Custom CRM & VoIP Integrations',
        'Custom LLM Fine-Tuning',
        'SLA 99.99% Guarantee'
      ]
    }
  ]
};
