import { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';

export default function QRScanner() {
  const { hotelData, scanQrCheckIn } = useApp();
  const { addToast } = useToast();
  const [scannedResult, setScannedResult] = useState(null);
  const [manualCode, setManualCode] = useState('');
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    let scanner = null;
    
    if (scanning) {
      scanner = new Html5QrcodeScanner('reader', { 
        qrbox: { width: 250, height: 250 }, 
        fps: 5 
      });
      
      scanner.render((decodedText) => {
        handleScan(decodedText);
        scanner.clear();
        setScanning(false);
      }, (error) => {
        // Ignore continuous scanning errors
      });
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(e => console.error(e));
      }
    };
  }, [scanning]);

  const handleScan = (code) => {
    if (!code) return;
    
    // Simulate real check-in based on context logic
    const result = scanQrCheckIn(code, hotelData?.id);
    
    if (result.success) {
      setScannedResult(result);
      addToast('Check-in successful!', 'success');
    } else {
      addToast(result.error || 'Invalid QR Code', 'error');
    }
  };

  const resetScanner = () => {
    setScannedResult(null);
    setManualCode('');
  };

  return (
    <div className="fade-in" style={{ maxWidth: 600, margin: '0 auto' }}>
      <div className="text-center" style={{ marginBottom: 32 }}>
        <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: '1.5rem', fontWeight: 600 }}>Guest Check-In</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Scan the traveler's digital QR pass to confirm their arrival.</p>
      </div>

      <div className="card">
        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          
          {!scannedResult ? (
            <>
              {/* Camera Scanner Area */}
              <div style={{ width: '100%', maxWidth: 400, minHeight: 300, background: 'var(--bg)', borderRadius: 12, border: '2px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 24, position: 'relative' }}>
                
                {scanning ? (
                  <div id="reader" style={{ width: '100%' }}></div>
                ) : (
                  <div style={{ textAlign: 'center', padding: 24 }}>
                    <div style={{ fontSize: '3rem', marginBottom: 16 }}>📷</div>
                    <button className="btn btn-primary" onClick={() => setScanning(true)}>
                      Start Camera
                    </button>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 12 }}>Requires camera permissions</p>
                  </div>
                )}
              </div>

              {/* Manual Fallback */}
              <div style={{ width: '100%', maxWidth: 400, borderTop: '1px solid var(--border-light)', paddingTop: 24 }}>
                <p style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Manual Entry (Fallback)</p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. BKG-12345" 
                    value={manualCode}
                    onChange={e => setManualCode(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleScan(manualCode)}
                    style={{ padding: '10px 14px' }}
                  />
                  <button className="btn btn-accent" onClick={() => handleScan(manualCode)} style={{ padding: '10px 20px' }}>Verify</button>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 8 }}>
                  For testing, try: <strong>BKG-9876</strong>
                </p>
              </div>
            </>
          ) : (
            
            /* Success Result View */
            <div className="fade-in" style={{ width: '100%', textAlign: 'center' }}>
              <div style={{ width: 80, height: 80, background: 'var(--success-bg)', color: 'var(--success)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', margin: '0 auto 24px' }}>
                ✓
              </div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: 8 }}>Check-In Confirmed!</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>The booking status has been successfully updated.</p>
              
              <div style={{ background: 'var(--bg)', padding: 24, borderRadius: 12, textAlign: 'left', marginBottom: 24, border: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Guest Name</span>
                  <strong style={{ fontSize: '1rem' }}>{scannedResult.booking.customerName}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Room Type</span>
                  <strong style={{ fontSize: '1rem' }}>{scannedResult.booking.roomType}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Booking ID</span>
                  <strong style={{ fontSize: '1rem', fontFamily: 'monospace' }}>{scannedResult.booking.id}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Stay Duration</span>
                  <strong style={{ fontSize: '0.9rem' }}>
                    {new Date(scannedResult.booking.checkIn).toLocaleDateString()} - {new Date(scannedResult.booking.checkOut).toLocaleDateString()}
                  </strong>
                </div>
              </div>

              <button className="btn btn-outline btn-block" onClick={resetScanner}>
                Scan Next Guest
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
