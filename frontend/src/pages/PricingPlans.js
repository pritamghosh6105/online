import React, { useState } from 'react';
import { Check, Shield, Zap, Building2, CreditCard, Download, Award } from 'lucide-react';
import { toast } from 'react-toastify';

const PricingPlans = () => {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [invoice, setInvoice] = useState(null);

  const plans = [
    {
      name: 'Free Starter',
      price: '$0',
      period: 'forever',
      description: 'Ideal for single educators and small classroom tests.',
      features: ['Up to 50 Students', '5 Active Exams', 'Automated MCQ Evaluation', 'Basic Proctoring Alerts', 'Standard Analytics']
    },
    {
      name: 'Professional',
      price: '$49',
      period: 'per month',
      popular: true,
      description: 'For growing schools, academies, and departments.',
      features: ['Up to 500 Students', 'Unlimited Exams', 'Webcam Face Verification', 'Question Bank & AI Generator', 'Leaderboard & Certificate QR', 'Priority Email Support']
    },
    {
      name: 'Enterprise',
      price: '$199',
      period: 'per month',
      description: 'Full institutional suite for universities and enterprise certifiers.',
      features: ['Unlimited Students', 'Unlimited Exams', 'Live Proctor Monitoring Feed', 'Custom QR Verified Certificates', 'Dedicated Audit Logs & SLA', 'ERP/LMS API Integration']
    }
  ];

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
    setShowCheckoutModal(true);
  };

  const handleSimulatePayment = (e) => {
    e.preventDefault();
    const inv = {
      invoiceId: 'INV-' + Math.floor(100000 + Math.random() * 900000),
      planName: selectedPlan.name,
      amount: selectedPlan.price,
      date: new Date().toLocaleDateString(),
      status: 'PAID'
    };
    setInvoice(inv);
    setShowCheckoutModal(false);
    toast.success(`Subscription updated to ${selectedPlan.name}!`);
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '40px auto', padding: '0 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: '50px' }}>
        <span style={{ backgroundColor: '#e0e7ff', color: '#3730a3', padding: '6px 16px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
          Flexible Institutional Plans
        </span>
        <h1 style={{ fontSize: '2.5rem', color: '#0f172a', margin: '16px 0 12px', fontWeight: 800 }}>
          Scale Your Online Examination System
        </h1>
        <p style={{ color: '#64748b', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
          Select the perfect plan with proctoring, AI question bank, leaderboard rankings, and custom certificates.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px', alignItems: 'stretch' }}>
        {plans.map((plan, idx) => (
          <div key={idx} style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            padding: '32px',
            boxShadow: plan.popular ? '0 20px 40px -15px rgba(37, 99, 235, 0.3)' : '0 4px 20px rgba(0,0,0,0.06)',
            border: plan.popular ? '2px solid #2563eb' : '1px solid #e2e8f0',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            {plan.popular && (
              <span style={{
                position: 'absolute',
                top: '-14px',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '4px 16px',
                borderRadius: '12px',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>
                Most Popular
              </span>
            )}

            <div>
              <h3 style={{ fontSize: '1.4rem', color: '#0f172a', margin: '0 0 8px' }}>{plan.name}</h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '20px', minHeight: '40px' }}>{plan.description}</p>
              
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '24px' }}>
                <span style={{ fontSize: '3rem', fontWeight: 800, color: '#0f172a' }}>{plan.price}</span>
                <span style={{ color: '#64748b', fontSize: '0.9rem' }}>/{plan.period}</span>
              </div>

              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '20px', marginBottom: '30px' }}>
                {plan.features.map((feat, fIdx) => (
                  <div key={fIdx} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', fontSize: '0.95rem', color: '#334155' }}>
                    <Check style={{ width: '18px', height: '18px', color: '#10b981', flexShrink: 0 }} />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <button 
              onClick={() => handleSelectPlan(plan)}
              style={{
                width: '100%',
                backgroundColor: plan.popular ? '#2563eb' : '#0f172a',
                color: '#ffffff',
                border: 'none',
                padding: '14px',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '1rem',
                cursor: 'pointer'
              }}
            >
              Choose {plan.name}
            </button>
          </div>
        ))}
      </div>

      {/* Invoice notification */}
      {invoice && (
        <div style={{ marginTop: '40px', backgroundColor: '#ecfdf5', border: '1px solid #10b981', borderRadius: '12px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h4 style={{ margin: 0, color: '#065f46', fontSize: '1.1rem' }}>✅ Invoice Generated: {invoice.invoiceId}</h4>
            <p style={{ margin: '4px 0 0', color: '#047857', fontSize: '0.9rem' }}>Plan: {invoice.planName} ({invoice.amount}) • Date: {invoice.date}</p>
          </div>
          <button onClick={() => window.print()} style={{ backgroundColor: '#059669', color: '#ffffff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
            <Download style={{ width: '16px', height: '16px' }} /> Download Invoice
          </button>
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckoutModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '28px', maxWidth: '450px', width: '100%' }}>
            <h3 style={{ margin: '0 0 16px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CreditCard /> Activate Plan: {selectedPlan.name}
            </h3>
            <form onSubmit={handleSimulatePayment}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Cardholder Name</label>
                <input type="text" defaultValue="Examin Administrator" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} required />
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Card Number</label>
                <input type="text" defaultValue="4242 •••• •••• 4242" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Expiry</label>
                  <input type="text" defaultValue="12/28" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>CVC</label>
                  <input type="text" defaultValue="123" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} required />
                </div>
              </div>
              <button type="submit" style={{ width: '100%', backgroundColor: '#2563eb', color: '#ffffff', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>
                Pay {selectedPlan.price} & Activate Subscription
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PricingPlans;
