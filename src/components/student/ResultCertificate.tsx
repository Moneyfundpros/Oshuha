import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';
import { useRef } from 'react';

interface ResultCertificateProps {
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
  registrationNumber: string;
  teachingPracticeSchool: string;
  supervisorName: string;
  supervisorId: string;
  score: number;
}

export default function ResultCertificate({
  isOpen,
  onClose,
  studentName,
  registrationNumber,
  teachingPracticeSchool,
  supervisorName,
  supervisorId,
  score,
}: ResultCertificateProps) {
  const certificateRef = useRef<HTMLDivElement>(null);

  const handleDownload = () => {
    if (!certificateRef.current) return;

    const printWindow = window.open('', '', 'height=800,width=800');
    if (!printWindow) return;

    const certificateHTML = certificateRef.current.innerHTML;

    printWindow.document.write(`
      <html>
        <head>
          <title>Teaching Practice Result - ${studentName}</title>
          <style>
            body {
              font-family: 'Georgia', 'Times New Roman', serif;
              margin: 0;
              padding: 20px;
              background: white;
            }
            .certificate {
              max-width: 800px;
              margin: 0 auto;
              padding: 40px;
              border: 3px solid #2c3e50;
              background: linear-gradient(to bottom, #ffffff 0%, #f8f9fa 100%);
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #2c3e50;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .logo {
              font-size: 48px;
              color: #2c3e50;
              margin-bottom: 10px;
            }
            .title {
              font-size: 32px;
              font-weight: bold;
              color: #2c3e50;
              margin: 10px 0;
            }
            .subtitle {
              font-size: 18px;
              color: #555;
              margin-top: 5px;
            }
            .content {
              padding: 30px 0;
            }
            .field {
              margin-bottom: 25px;
              display: flex;
              border-bottom: 1px dashed #ddd;
              padding-bottom: 10px;
            }
            .field-label {
              font-weight: 600;
              color: #2c3e50;
              min-width: 200px;
              font-size: 16px;
            }
            .field-value {
              flex: 1;
              color: #333;
              font-size: 16px;
            }
            .score-box {
              text-align: center;
              margin: 30px 0;
              padding: 20px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              border-radius: 10px;
              color: white;
            }
            .score-label {
              font-size: 18px;
              margin-bottom: 10px;
            }
            .score-value {
              font-size: 48px;
              font-weight: bold;
            }
            .signatures {
              display: flex;
              justify-content: space-between;
              margin-top: 60px;
              padding-top: 30px;
              border-top: 2px solid #2c3e50;
            }
            .signature-box {
              text-align: center;
              flex: 1;
            }
            .signature-line {
              border-top: 2px solid #333;
              margin-bottom: 10px;
              margin-top: 40px;
            }
            .signature-label {
              font-size: 14px;
              color: #555;
              font-weight: 600;
            }
            .stamp-box {
              text-align: center;
              flex: 1;
            }
            .stamp-area {
              border: 2px dashed #999;
              height: 80px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #999;
              font-style: italic;
              margin-bottom: 10px;
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              font-size: 12px;
              color: #777;
              padding-top: 20px;
              border-top: 1px solid #ddd;
            }
            @media print {
              body { padding: 0; }
              .certificate { border: none; }
            }
          </style>
        </head>
        <body>
          ${certificateHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Teaching Practice Result Certificate</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div ref={certificateRef} className="certificate">
          <div className="header">
            <div className="logo">🎓</div>
            <div className="title">TEACHING PRACTICE RESULT</div>
            <div className="subtitle">Academic Year 2024/2025</div>
            <div className="subtitle" style={{ marginTop: '10px', fontSize: '14px' }}>
              Issued on: {currentDate}
            </div>
          </div>

          <div className="content">
            <div className="field">
              <div className="field-label">Student Name:</div>
              <div className="field-value">{studentName}</div>
            </div>

            <div className="field">
              <div className="field-label">Registration Number:</div>
              <div className="field-value" style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                {registrationNumber}
              </div>
            </div>

            <div className="field">
              <div className="field-label">Teaching Practice School:</div>
              <div className="field-value">{teachingPracticeSchool}</div>
            </div>

            <div className="field">
              <div className="field-label">Supervisor Name:</div>
              <div className="field-value">{supervisorName}</div>
            </div>

            <div className="field">
              <div className="field-label">Supervisor ID:</div>
              <div className="field-value" style={{ fontFamily: 'monospace' }}>{supervisorId}</div>
            </div>

            <div className="score-box">
              <div className="score-label">FINAL SCORE</div>
              <div className="score-value">{score}/100</div>
            </div>

            <div style={{ textAlign: 'center', marginTop: '20px', fontStyle: 'italic', color: '#555' }}>
              This certifies that the above-named student has successfully completed
              <br />
              their teaching practice program under proper supervision.
            </div>
          </div>

          <div className="signatures">
            <div className="signature-box">
              <div className="signature-line"></div>
              <div className="signature-label">Student Signature</div>
            </div>

            <div className="stamp-box">
              <div className="stamp-area">Official Stamp</div>
              <div className="signature-label">Institution Seal</div>
            </div>

            <div className="signature-box">
              <div className="signature-line"></div>
              <div className="signature-label">Supervisor Signature</div>
            </div>
          </div>

          <div className="footer">
            This is an official document issued by PracticePortal Teaching Practice Management System
            <br />
            Document ID: {registrationNumber}-{new Date().getFullYear()}
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download/Print Certificate
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
