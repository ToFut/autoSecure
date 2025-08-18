import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { RootState } from '../store/index';
import { addNotification } from '../store/slices/uiSlice';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface ExportManagerProps {
  mapInstance: google.maps.Map | null;
}

const ExportManager: React.FC<ExportManagerProps> = ({ mapInstance }) => {
  const dispatch = useDispatch();
  const { currentPlan } = useSelector((state: RootState) => state.security);
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'israeli_police' | 'json' | 'csv' | 'docx'>('pdf');

  // Generate comprehensive security report
  const generateReport = () => {
    if (!currentPlan) {
      dispatch(addNotification({
        type: 'error',
        title: 'Export Failed',
        message: 'No security plan to export'
      }));
      return null;
    }

    const report = {
      metadata: {
        title: 'Security Operations Plan',
        planId: currentPlan.id,
        planName: currentPlan.name,
        generatedAt: new Date().toISOString(),
        generatedBy: 'AutoSecure AI System',
        classification: 'CONFIDENTIAL'
      },
      executive_summary: {
        area_covered: `${Math.round(currentPlan.area).toLocaleString()} square meters`,
        estimated_capacity: currentPlan.capacity,
        threat_level: calculateThreatLevel(),
        total_resources: currentPlan.resources.reduce((sum, r) => sum + r.count, 0),
        estimated_cost: calculateEstimatedCost()
      },
      perimeter_definition: {
        total_points: currentPlan.perimeter.length,
        coordinates: currentPlan.perimeter.map(pin => ({
          id: pin.id,
          latitude: pin.lat.toFixed(6),
          longitude: pin.lng.toFixed(6),
          label: pin.label
        })),
        perimeter_length: calculatePerimeterLength(),
        entry_points: identifyEntryPoints(),
        vulnerable_sections: identifyVulnerableSections()
      },
      threat_assessment: {
        identified_threats: currentPlan.risks.length,
        high_priority: currentPlan.risks.filter(r => r.level === 'high').length,
        medium_priority: currentPlan.risks.filter(r => r.level === 'medium').length,
        low_priority: currentPlan.risks.filter(r => r.level === 'low').length,
        threats: currentPlan.risks.map(risk => ({
          id: risk.id,
          severity: risk.level,
          category: risk.category,
          title: risk.title,
          description: risk.description,
          location: risk.location,
          mitigation_measures: risk.recommendations
        }))
      },
      resource_deployment: {
        personnel: {
          guards: currentPlan.resources.filter(r => r.type === 'guard').reduce((sum, r) => sum + r.count, 0),
          k9_units: currentPlan.resources.filter(r => (r.type as any) === 'k9').reduce((sum, r) => sum + r.count, 0),
          medical: currentPlan.resources.filter(r => r.type === 'medical').reduce((sum, r) => sum + r.count, 0)
        },
        equipment: {
          cameras: currentPlan.resources.filter(r => r.type === 'camera').reduce((sum, r) => sum + r.count, 0),
          barriers: currentPlan.resources.filter(r => r.type === 'barrier').reduce((sum, r) => sum + r.count, 0),
          sensors: currentPlan.resources.filter(r => (r.type as any) === 'sensor').reduce((sum, r) => sum + r.count, 0)
        },
        deployment_status: currentPlan.resources.map(resource => ({
          type: resource.type,
          total: resource.count,
          deployed: resource.deployed,
          status: resource.status,
          coverage_percentage: (resource.deployed / resource.count * 100).toFixed(0) + '%'
        }))
      },
      operational_guidelines: {
        command_structure: generateCommandStructure(),
        communication_protocols: generateCommProtocols(),
        emergency_procedures: generateEmergencyProcedures(),
        shift_schedule: generateShiftSchedule(),
        contingency_plans: generateContingencyPlans()
      },
      compliance_checklist: {
        legal_requirements: [
          { item: 'Security personnel licensing', status: 'VERIFIED' },
          { item: 'Insurance coverage', status: 'VERIFIED' },
          { item: 'Local permits obtained', status: 'PENDING' },
          { item: 'Emergency services notified', status: 'VERIFIED' }
        ],
        safety_standards: [
          { item: 'Fire safety compliance', status: 'VERIFIED' },
          { item: 'Medical emergency preparedness', status: 'VERIFIED' },
          { item: 'Evacuation routes marked', status: 'VERIFIED' },
          { item: 'Crowd control measures', status: 'VERIFIED' }
        ]
      },
      appendices: {
        contact_list: generateContactList(),
        equipment_specifications: generateEquipmentSpecs(),
        site_maps: 'See attached visual materials',
        training_requirements: generateTrainingReqs()
      }
    };

    return report;
  };

  // Calculate threat level
  const calculateThreatLevel = () => {
    if (!currentPlan) return 'UNKNOWN';
    const highThreats = currentPlan.risks.filter(r => r.level === 'high').length;
    if (highThreats > 3) return 'CRITICAL';
    if (highThreats > 1) return 'HIGH';
    if (currentPlan.risks.length > 3) return 'MEDIUM';
    return 'LOW';
  };

  // Calculate estimated cost
  const calculateEstimatedCost = () => {
    if (!currentPlan) return 0;
    
    const costs = {
      guard: 250, // per day
      camera: 150,
      barrier: 50,
      medical: 500,
      k9: 400,
      drone: 1000
    };

    return currentPlan.resources.reduce((total, resource) => {
      const unitCost = costs[resource.type as keyof typeof costs] || 100;
      return total + (resource.count * unitCost);
    }, 0);
  };

  // Calculate perimeter length
  const calculatePerimeterLength = () => {
    if (!currentPlan || currentPlan.perimeter.length < 2) return 0;
    
    let length = 0;
    for (let i = 0; i < currentPlan.perimeter.length; i++) {
      const current = currentPlan.perimeter[i];
      const next = currentPlan.perimeter[(i + 1) % currentPlan.perimeter.length];
      
      const distance = google.maps.geometry.spherical.computeDistanceBetween(
        new google.maps.LatLng(current.lat, current.lng),
        new google.maps.LatLng(next.lat, next.lng)
      );
      
      length += distance;
    }
    
    return Math.round(length);
  };

  // Identify entry points
  const identifyEntryPoints = () => {
    return [
      { location: 'North Gate', type: 'Vehicle', security_level: 'HIGH' },
      { location: 'South Gate', type: 'Pedestrian', security_level: 'MEDIUM' },
      { location: 'VIP Entrance', type: 'Restricted', security_level: 'MAXIMUM' },
      { location: 'Service Entry', type: 'Delivery', security_level: 'HIGH' }
    ];
  };

  // Identify vulnerable sections
  const identifyVulnerableSections = () => {
    return [
      { section: 'Northwest Corner', vulnerability: 'Limited visibility', mitigation: 'Additional lighting required' },
      { section: 'Eastern Perimeter', vulnerability: 'Adjacent building access', mitigation: 'Rooftop surveillance needed' }
    ];
  };

  // Generate command structure
  const generateCommandStructure = () => {
    return {
      incident_commander: 'Chief Security Officer',
      deputy_commander: 'Operations Manager',
      sector_chiefs: ['North Sector Chief', 'South Sector Chief', 'VIP Protection Lead'],
      support_roles: ['Communications Coordinator', 'Medical Team Lead', 'K9 Unit Supervisor']
    };
  };

  // Generate communication protocols
  const generateCommProtocols = () => {
    return {
      primary_channel: 'Channel 1 - Main Operations',
      secondary_channel: 'Channel 2 - Tactical',
      emergency_channel: 'Channel 3 - Emergency',
      command_channel: 'Channel 4 - Command Only',
      protocols: [
        'Radio check every 30 minutes',
        'Clear and concise communication',
        'Use NATO phonetic alphabet',
        'Emergency code words established'
      ]
    };
  };

  // Generate emergency procedures
  const generateEmergencyProcedures = () => {
    return [
      { scenario: 'Medical Emergency', response: 'Code Blue - Medical team dispatch', time: '< 2 minutes' },
      { scenario: 'Security Breach', response: 'Code Red - Lockdown protocol', time: '< 30 seconds' },
      { scenario: 'Evacuation', response: 'Code Yellow - Controlled evacuation', time: '< 5 minutes' },
      { scenario: 'Fire', response: 'Code Orange - Fire response team', time: '< 1 minute' }
    ];
  };

  // Generate shift schedule
  const generateShiftSchedule = () => {
    return {
      shift_pattern: '12-hour rotation',
      shifts: [
        { name: 'Alpha Shift', time: '06:00 - 18:00', personnel: 12 },
        { name: 'Bravo Shift', time: '18:00 - 06:00', personnel: 12 },
        { name: 'Reserve Team', time: 'On-call', personnel: 6 }
      ],
      break_schedule: 'Staggered 30-minute breaks',
      handover_protocol: '15-minute overlap for briefing'
    };
  };

  // Generate contingency plans
  const generateContingencyPlans = () => {
    return [
      { scenario: 'Weather Emergency', plan: 'Indoor relocation protocol', resources: 'Emergency shelters prepared' },
      { scenario: 'Power Failure', plan: 'Backup generators activation', resources: 'Emergency lighting ready' },
      { scenario: 'Mass Casualty', plan: 'Triage and evacuation', resources: 'Medical teams on standby' }
    ];
  };

  // Generate contact list
  const generateContactList = () => {
    return [
      { role: 'Emergency Services', number: '911', priority: 'PRIMARY' },
      { role: 'Command Center', number: '+1-555-0100', priority: 'PRIMARY' },
      { role: 'Medical Director', number: '+1-555-0101', priority: 'HIGH' },
      { role: 'Local Police', number: '+1-555-0102', priority: 'HIGH' }
    ];
  };

  // Generate equipment specifications
  const generateEquipmentSpecs = () => {
    return [
      { equipment: 'CCTV Cameras', model: 'PTZ-4K-IR', specs: '4K resolution, 360° rotation, 100m IR range' },
      { equipment: 'Metal Detectors', model: 'MD-3000X', specs: 'Walk-through, 30 zones, weapons detection' },
      { equipment: 'Radio System', model: 'DMR-800', specs: 'Encrypted, 10km range, 16 channels' }
    ];
  };

  // Generate training requirements
  const generateTrainingReqs = () => {
    return [
      { training: 'Crowd Control', hours: 8, certification: 'Required' },
      { training: 'First Aid/CPR', hours: 4, certification: 'Required' },
      { training: 'Threat Detection', hours: 6, certification: 'Recommended' },
      { training: 'Communications Protocol', hours: 2, certification: 'Required' }
    ];
  };

  // Generate Israeli Police-style Operation Order (פקודת מבצע)
  const generateIsraeliPoliceOperationOrder = () => {
    if (!currentPlan) return null;

    const operationOrder = {
      header: {
        title: 'פקודת מבצע - פקודת אבטחה',
        operationName: currentPlan.name || 'מבצע אבטחה',
        operationNumber: `OP-${Date.now()}`,
        date: new Date().toLocaleDateString('he-IL'),
        time: new Date().toLocaleTimeString('he-IL'),
        classification: 'סודי',
        unit: 'יחידת האבטחה',
        commander: 'מפקד המבצע'
      },
      situation: {
        enemy: {
          threats: currentPlan.risks.filter(r => r.level === 'high').map(risk => ({
            type: risk.category,
            description: risk.description,
            location: `${risk.location.lat.toFixed(6)}, ${risk.location.lng.toFixed(6)}`,
            probability: 'גבוה'
          })),
          capabilities: [
            'יכולת חדירה למוקד',
            'שימוש בנשק קל',
            'פעילות חבלנית',
            'התקפות רשת'
          ]
        },
        friendly: {
          forces: {
            guards: currentPlan.resources.filter(r => r.type === 'guard').reduce((sum, r) => sum + r.count, 0),
            k9: currentPlan.resources.filter(r => r.type === 'k9').reduce((sum, r) => sum + r.count, 0),
            medical: currentPlan.resources.filter(r => r.type === 'medical').reduce((sum, r) => sum + r.count, 0),
            total: currentPlan.resources.reduce((sum, r) => sum + r.count, 0)
          },
          equipment: {
            cameras: currentPlan.resources.filter(r => r.type === 'camera').reduce((sum, r) => sum + r.count, 0),
            sensors: currentPlan.resources.filter(r => r.type === 'sensor').reduce((sum, r) => sum + r.count, 0),
            barriers: currentPlan.resources.filter(r => r.type === 'barrier').reduce((sum, r) => sum + r.count, 0)
          }
        },
        terrain: {
          area: `${Math.round(currentPlan.area).toLocaleString()} מ"ר`,
          perimeter: `${calculatePerimeterLength()} מטר`,
          entryPoints: identifyEntryPoints().length,
          vulnerableAreas: identifyVulnerableSections().length
        }
      },
      mission: {
        primary: 'אבטחת המוקד ומניעת חדירת גורמים עוינים',
        secondary: 'הגנה על חיי אדם ורכוש',
        constraints: [
          'שמירה על זכויות אזרח',
          'איסור שימוש בכוח מופרז',
          'ציות לחוקי המדינה'
        ]
      },
      execution: {
        concept: {
          phase1: 'הקמת מערך האבטחה והכנת המוקד',
          phase2: 'הפעלת מערכות האבטחה והתחלת סיורים',
          phase3: 'ניהול אירועים ותגובה לאיומים',
          phase4: 'סיום המבצע ופינוי הכוחות'
        },
        tasks: {
          alpha: {
            commander: 'מפקד צוות אלפא',
            mission: 'אבטחת הכניסה הראשית',
            resources: '4 שוטרים, 2 כלבי שמירה',
            location: 'שער ראשי'
          },
          bravo: {
            commander: 'מפקד צוות בראבו',
            mission: 'סיור היקפי ופיקוח על הגדר',
            resources: '6 שוטרים, 1 כלב שמירה',
            location: 'היקף המוקד'
          },
          charlie: {
            commander: 'מפקד צוות צארלי',
            mission: 'אבטחת פנים המוקד',
            resources: '8 שוטרים, 2 כלבי שמירה',
            location: 'אזורים פנימיים'
          },
          delta: {
            commander: 'מפקד צוות דלתא',
            mission: 'תגובה מהירה וטיפול באירועים',
            resources: '4 שוטרים, 1 צוות רפואי',
            location: 'מרכז התגובה'
          }
        },
        coordination: {
          signals: {
            primary: 'ערוץ רדיו 1 - תקשורת ראשית',
            secondary: 'ערוץ רדיו 2 - תקשורת משנית',
            emergency: 'ערוץ רדיו 3 - מצבי חירום',
            codes: {
              'קוד אדום': 'אירוע אבטחה חמור',
              'קוד צהוב': 'חשד לפעילות חשודה',
              'קוד כחול': 'אירוע רפואי',
              'קוד שחור': 'אירוע חבלני'
            }
          },
          timing: {
            start: '06:00',
            end: '22:00',
            shiftChange: '10:00, 18:00',
            briefing: '05:30, 09:30, 17:30'
          }
        }
      },
      service: {
        logistics: {
          supplies: [
            'ציוד אבטחה אישי',
            'מכשירי קשר',
            'תחמושת',
            'ציוד רפואי',
            'מזון ומים'
          ],
          transportation: [
            'רכבי סיור',
            'רכב פיקוד',
            'רכב רפואי',
            'רכב תגובה מהירה'
          ]
        },
        medical: {
          teams: currentPlan.resources.filter(r => r.type === 'medical').reduce((sum, r) => sum + r.count, 0),
          location: 'מרכז רפואי במוקד',
          evacuation: 'בית חולים קרוב - 10 דקות'
        }
      },
      command: {
        chain: {
          commander: 'מפקד המבצע',
          deputy: 'סגן מפקד המבצע',
          alpha: 'מפקד צוות אלפא',
          bravo: 'מפקד צוות בראבו',
          charlie: 'מפקד צוות צארלי',
          delta: 'מפקד צוות דלתא'
        },
        location: 'מרכז הפיקוד - בניין ראשי',
        communications: {
          primary: '+972-XX-XXX-XXXX',
          secondary: '+972-XX-XXX-XXXX',
          emergency: '100'
        }
      }
    };

    return operationOrder;
  };

  // Export as PDF
  const exportAsPDF = async () => {
    setIsExporting(true);
    
    try {
      const report = generateReport();
      if (!report) return;

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageHeight = pdf.internal.pageSize.height;
      let yPosition = 20;

      // Title Page
      pdf.setFontSize(24);
      pdf.setTextColor(0, 255, 136);
      pdf.text('SECURITY OPERATIONS PLAN', 105, yPosition, { align: 'center' });
      
      yPosition += 15;
      pdf.setFontSize(12);
      pdf.setTextColor(100, 100, 100);
      pdf.text(report.metadata.planName, 105, yPosition, { align: 'center' });
      
      yPosition += 10;
      pdf.setFontSize(10);
      pdf.text(`Generated: ${new Date().toLocaleString()}`, 105, yPosition, { align: 'center' });
      
      yPosition += 10;
      pdf.setTextColor(255, 0, 0);
      pdf.text('CONFIDENTIAL', 105, yPosition, { align: 'center' });

      // Executive Summary
      pdf.addPage();
      yPosition = 20;
      pdf.setFontSize(16);
      pdf.setTextColor(0, 0, 0);
      pdf.text('EXECUTIVE SUMMARY', 20, yPosition);
      
      yPosition += 10;
      pdf.setFontSize(10);
      pdf.text(`Area Covered: ${report.executive_summary.area_covered}`, 20, yPosition);
      yPosition += 7;
      pdf.text(`Threat Level: ${report.executive_summary.threat_level}`, 20, yPosition);
      yPosition += 7;
      pdf.text(`Total Resources: ${report.executive_summary.total_resources}`, 20, yPosition);
      yPosition += 7;
      pdf.text(`Estimated Cost: $${report.executive_summary.estimated_cost.toLocaleString()}`, 20, yPosition);

      // Threat Assessment
      pdf.addPage();
      yPosition = 20;
      pdf.setFontSize(16);
      pdf.text('THREAT ASSESSMENT', 20, yPosition);
      
      yPosition += 10;
      pdf.setFontSize(10);
      report.threat_assessment.threats.forEach(threat => {
        if (yPosition > pageHeight - 30) {
          pdf.addPage();
          yPosition = 20;
        }
        
        pdf.setTextColor(
          threat.severity === 'high' ? 255 : 0,
          threat.severity === 'low' ? 255 : threat.severity === 'medium' ? 165 : 0,
          0
        );
        pdf.text(`[${threat.severity.toUpperCase()}] ${threat.title}`, 20, yPosition);
        
        pdf.setTextColor(0, 0, 0);
        yPosition += 5;
        
        const descLines = pdf.splitTextToSize(threat.description, 170);
        descLines.forEach((line: string) => {
          pdf.text(line, 25, yPosition);
          yPosition += 5;
        });
        
        yPosition += 5;
      });

      // Resource Deployment
      pdf.addPage();
      yPosition = 20;
      pdf.setFontSize(16);
      pdf.text('RESOURCE DEPLOYMENT', 20, yPosition);
      
      yPosition += 10;
      pdf.setFontSize(10);
      pdf.text('Personnel:', 20, yPosition);
      yPosition += 7;
      pdf.text(`  Guards: ${report.resource_deployment.personnel.guards}`, 25, yPosition);
      yPosition += 5;
      pdf.text(`  K9 Units: ${report.resource_deployment.personnel.k9_units}`, 25, yPosition);
      yPosition += 5;
      pdf.text(`  Medical: ${report.resource_deployment.personnel.medical}`, 25, yPosition);
      
      yPosition += 10;
      pdf.text('Equipment:', 20, yPosition);
      yPosition += 7;
      pdf.text(`  Cameras: ${report.resource_deployment.equipment.cameras}`, 25, yPosition);
      yPosition += 5;
      pdf.text(`  Barriers: ${report.resource_deployment.equipment.barriers}`, 25, yPosition);

      // Save the PDF
      pdf.save(`SecurityPlan_${currentPlan?.id || 'default'}_${Date.now()}.pdf`);
      
      dispatch(addNotification({
        type: 'success',
        title: 'Export Complete',
        message: 'Security plan exported as PDF'
      }));
    } catch (error) {
      console.error('Export error:', error);
      dispatch(addNotification({
        type: 'error',
        title: 'Export Failed',
        message: 'Could not generate PDF report'
      }));
    } finally {
      setIsExporting(false);
    }
  };

  // Export as JSON
  const exportAsJSON = () => {
    const report = generateReport();
    if (!report) return;

    const dataStr = JSON.stringify(report, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `SecurityPlan_${currentPlan?.id}_${Date.now()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    dispatch(addNotification({
      type: 'success',
      title: 'Export Complete',
      message: 'Security plan exported as JSON'
    }));
  };

  // Export as CSV
  const exportAsCSV = () => {
    if (!currentPlan) return;

    let csv = 'Category,Type,Count,Status\n';
    
    currentPlan.resources.forEach(resource => {
      csv += `Resources,${resource.type},${resource.count},${resource.status}\n`;
    });
    
    currentPlan.risks.forEach(risk => {
      csv += `Threats,${risk.category},${risk.level},${risk.title}\n`;
    });
    
    const dataUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    const exportFileDefaultName = `SecurityPlan_${currentPlan.id}_${Date.now()}.csv`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    dispatch(addNotification({
      type: 'success',
      title: 'Export Complete',
      message: 'Security plan exported as CSV'
    }));
  };

  // Export Israeli Police Operation Order as PDF
  const exportIsraeliPolicePDF = async () => {
    setIsExporting(true);
    
    try {
      const opOrder = generateIsraeliPoliceOperationOrder();
      if (!opOrder) {
        dispatch(addNotification({
          type: 'error',
          title: 'Export Failed',
          message: 'No operation order data available'
        }));
        return;
      }

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageHeight = pdf.internal.pageSize.height;
      const pageWidth = pdf.internal.pageSize.width;
      let yPosition = 20;

      // Add Hebrew font support (basic implementation)
      pdf.setFont('helvetica');

      // Header with Hebrew title
      pdf.setFontSize(20);
      pdf.setTextColor(0, 0, 0);
      pdf.text('פקודת מבצע - פקודת אבטחה', pageWidth/2, yPosition, { align: 'center' });
      
      yPosition += 10;
      pdf.setFontSize(14);
      pdf.text(`Operation Order - Security Operation`, pageWidth/2, yPosition, { align: 'center' });
      
      yPosition += 15;
      pdf.setFontSize(12);
      pdf.text(`Operation: ${opOrder.header.operationName}`, 20, yPosition);
      pdf.text(`Date: ${opOrder.header.date}`, pageWidth - 60, yPosition);
      
      yPosition += 8;
      pdf.text(`Operation Number: ${opOrder.header.operationNumber}`, 20, yPosition);
      pdf.text(`Time: ${opOrder.header.time}`, pageWidth - 60, yPosition);

      // Situation Section
      yPosition += 15;
      pdf.setFontSize(16);
      pdf.setTextColor(0, 0, 0);
      pdf.text('1. SITUATION (מצב)', 20, yPosition);
      
      yPosition += 10;
      pdf.setFontSize(12);
      pdf.text('1.1 Enemy Forces (כוחות האויב):', 25, yPosition);
      
      yPosition += 8;
      pdf.setFontSize(10);
      opOrder.situation.enemy.threats.forEach((threat, index) => {
        if (yPosition > pageHeight - 40) {
          pdf.addPage();
          yPosition = 20;
        }
        pdf.text(`${index + 1}. ${threat.type}: ${threat.description}`, 30, yPosition);
        yPosition += 6;
      });

      // Mission Section
      yPosition += 10;
      pdf.setFontSize(16);
      pdf.text('2. MISSION (משימה)', 20, yPosition);
      
      yPosition += 10;
      pdf.setFontSize(12);
      pdf.text(`Primary Mission: ${opOrder.mission.primary}`, 25, yPosition);
      
      yPosition += 8;
      pdf.text(`Secondary Mission: ${opOrder.mission.secondary}`, 25, yPosition);

      // Execution Section
      yPosition += 15;
      pdf.setFontSize(16);
      pdf.text('3. EXECUTION (ביצוע)', 20, yPosition);
      
      yPosition += 10;
      pdf.setFontSize(12);
      pdf.text('3.1 Concept of Operations:', 25, yPosition);
      
      yPosition += 8;
      pdf.setFontSize(10);
      Object.entries(opOrder.execution.concept).forEach(([phase, description]) => {
        if (yPosition > pageHeight - 40) {
          pdf.addPage();
          yPosition = 20;
        }
        pdf.text(`${phase}: ${description}`, 30, yPosition);
        yPosition += 6;
      });

      // Tasks Section
      yPosition += 10;
      pdf.setFontSize(12);
      pdf.text('3.2 Tasks to Subordinate Units:', 25, yPosition);
      
      yPosition += 8;
      Object.entries(opOrder.execution.tasks).forEach(([team, task]) => {
        if (yPosition > pageHeight - 40) {
          pdf.addPage();
          yPosition = 20;
        }
        pdf.setFontSize(10);
        pdf.text(`${team.toUpperCase()} Team:`, 30, yPosition);
        yPosition += 6;
        pdf.text(`  Commander: ${task.commander}`, 35, yPosition);
        yPosition += 6;
        pdf.text(`  Mission: ${task.mission}`, 35, yPosition);
        yPosition += 6;
        pdf.text(`  Resources: ${task.resources}`, 35, yPosition);
        yPosition += 6;
        pdf.text(`  Location: ${task.location}`, 35, yPosition);
        yPosition += 8;
      });

      // Command Section
      yPosition += 10;
      pdf.setFontSize(16);
      pdf.text('4. COMMAND (פיקוד)', 20, yPosition);
      
      yPosition += 10;
      pdf.setFontSize(12);
      pdf.text('4.1 Chain of Command:', 25, yPosition);
      
      yPosition += 8;
      pdf.setFontSize(10);
      Object.entries(opOrder.command.chain).forEach(([position, name]) => {
        if (yPosition > pageHeight - 40) {
          pdf.addPage();
          yPosition = 20;
        }
        pdf.text(`${position}: ${name}`, 30, yPosition);
        yPosition += 6;
      });

      // Communications
      yPosition += 10;
      pdf.setFontSize(12);
      pdf.text('4.2 Communications:', 25, yPosition);
      
      yPosition += 8;
      pdf.setFontSize(10);
      pdf.text(`Primary: ${opOrder.command.communications.primary}`, 30, yPosition);
      yPosition += 6;
      pdf.text(`Emergency: ${opOrder.command.communications.emergency}`, 30, yPosition);

      // Save the PDF
      const fileName = `Operation_Order_${opOrder.header.operationNumber}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

      dispatch(addNotification({
        type: 'success',
        title: 'Operation Order Exported',
        message: `Israeli Police-style Operation Order saved as ${fileName}`
      }));

    } catch (error) {
      console.error('PDF export error:', error);
      dispatch(addNotification({
        type: 'error',
        title: 'Export Failed',
        message: 'Failed to generate Operation Order PDF'
      }));
    } finally {
      setIsExporting(false);
    }
  };

  // Handle export based on format
  const handleExport = () => {
    switch (exportFormat) {
      case 'pdf':
        exportAsPDF();
        break;
      case 'israeli_police':
        exportIsraeliPolicePDF();
        break;
      case 'json':
        exportAsJSON();
        break;
      case 'csv':
        exportAsCSV();
        break;
      default:
        dispatch(addNotification({
          type: 'error',
          title: 'Export Error',
          message: 'Unsupported export format'
        }));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-4 right-4 bg-dark-900/95 backdrop-blur-xl border border-primary-500/20 rounded-xl p-4 shadow-2xl z-40"
    >
      <div className="flex items-center gap-3">
        <select
          value={exportFormat}
          onChange={(e) => setExportFormat(e.target.value as any)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-primary-500 focus:outline-none"
        >
          <option value="pdf">PDF Report</option>
          <option value="israeli_police">🇮🇱 Israeli Police Operation Order</option>
          <option value="json">JSON Data</option>
          <option value="csv">CSV Export</option>
        </select>
        
        <button
          onClick={handleExport}
          disabled={isExporting || !currentPlan}
          className="px-4 py-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-black font-semibold rounded-lg hover:shadow-lg hover:shadow-primary-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isExporting ? (
            <>
              <i className="fas fa-spinner fa-spin mr-2"></i>
              Exporting...
            </>
          ) : (
            <>
              <i className="fas fa-download mr-2"></i>
              Export Plan
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
};

export default ExportManager;