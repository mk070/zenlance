import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class PDFService {
  constructor() {
    this.colors = {
      primary: '#2563eb',      // Professional blue
      secondary: '#1e40af',    // Darker blue
      accent: '#0ea5e9',       // Sky blue
      text: '#1f2937',         // Dark gray
      lightText: '#6b7280',    // Medium gray
      border: '#e5e7eb',       // Light gray
      background: '#f8fafc',   // Very light gray
      white: '#ffffff'
    };
    
    // Professional margins and spacing
    this.margins = {
      left: 50,
      right: 50,
      top: 50,
      bottom: 80
    };
    
    // Calculate content area
    this.pageWidth = 595.28;  // A4 width
    this.pageHeight = 841.89; // A4 height
    this.contentWidth = this.pageWidth - this.margins.left - this.margins.right;
  }

  async generateProposalPDF(proposal, userProfile) {
    return new Promise((resolve, reject) => {
      try {
        console.log('🔍 Starting professional PDF generation for proposal:', proposal?._id);
        
        const doc = new PDFDocument({
          size: 'A4',
          margins: this.margins,
          bufferPages: false // Disable buffering to prevent empty pages
        });

        const chunks = [];
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(chunks);
          console.log('✅ Professional PDF generation completed, buffer size:', pdfBuffer.length);
          resolve(pdfBuffer);
        });

        doc.on('error', (error) => {
          console.error('❌ PDF generation error:', error);
          reject(error);
        });

        try {
          // Generate content in controlled sequence
          this.addEnhancedHeader(doc, proposal, userProfile);
          this.addEnhancedContent(doc, proposal, userProfile);
          // Footer is now handled within addEnhancedContent to prevent extra pages
        } catch (contentError) {
          console.error('❌ PDF content generation error:', contentError);
          doc.fontSize(16)
             .fillColor('#dc2626')
             .text('Error generating proposal content', 50, 200);
          
          // Add basic footer for error case
          doc.fontSize(8)
             .fillColor(this.colors.lightText)
             .text('Professional Business Proposal', this.margins.left, doc.page.height - 30);
        }

        // End document immediately after content - no extra processing
        doc.end();
      } catch (error) {
        console.error('❌ Professional PDF generation failed:', error);
        reject(error);
      }
    });
  }

  addEnhancedHeader(doc, proposal, userProfile) {
    try {
      // Premium header design with gradient effect
      const headerHeight = 160;
      
      // Sophisticated gradient background
      const gradient = doc.linearGradient(0, 0, this.pageWidth, headerHeight);
      gradient.stop(0, this.colors.primary);
      gradient.stop(1, this.colors.secondary);
      
      doc.rect(0, 0, this.pageWidth, headerHeight)
         .fill(gradient);

      // White content overlay for readability
      doc.rect(0, headerHeight - 40, this.pageWidth, 40)
         .fillOpacity(0.95)
         .fill(this.colors.white)
         .fillOpacity(1);

      // Company branding section
      const businessName = userProfile?.businessName || 
        `${userProfile?.firstName || ''} ${userProfile?.lastName || ''}`.trim() || 
        'Professional Services';
        
    doc.fontSize(32)
       .font('Helvetica-Bold')
         .fillColor(this.colors.white)
         .text(businessName, this.margins.left, 30);

      // Professional tagline with enhanced styling
      const tagline = userProfile?.tagline || 
        (userProfile?.specializations && userProfile.specializations.length > 0 
          ? `Specialized in ${userProfile.specializations[0]}` 
          : 'Professional Digital Solutions');
      
      doc.fontSize(14)
         .font('Helvetica-Oblique')
         .fillColor('#f1f5f9')
         .text(tagline, this.margins.left, 70);

      // Professional contact card (right side)
      const cardX = this.pageWidth - 280;
      const cardY = 20;
      const cardWidth = 250;
      const cardHeight = 100;
      
      // Contact card background
      doc.rect(cardX, cardY, cardWidth, cardHeight)
         .fill('#ffffff')
         .stroke(this.colors.primary)
         .fillOpacity(0.95)
         .fillOpacity(1);

      // Developer information in card
      let cardContentY = cardY + 15;
      
      if (userProfile?.firstName && userProfile?.lastName) {
        const devName = `${userProfile.firstName} ${userProfile.lastName}`;
        const title = userProfile?.jobTitle || userProfile?.title || 'Senior Consultant';
        
        doc.fontSize(14)
       .font('Helvetica-Bold')
           .fillColor(this.colors.text)
           .text(devName, cardX + 15, cardContentY);
        cardContentY += 16;

        doc.fontSize(11)
       .font('Helvetica')
           .fillColor(this.colors.primary)
           .text(title, cardX + 15, cardContentY);
        cardContentY += 20;
      }
      
      // Contact details in compact format without emojis
      const contactInfo = [];
      if (userProfile?.email) contactInfo.push(`Email: ${userProfile.email}`);
      if (userProfile?.phone) contactInfo.push(`Phone: ${userProfile.phone}`);
      
      contactInfo.forEach((info, index) => {
        doc.fontSize(9)
           .font('Helvetica')
           .fillColor(this.colors.text)
           .text(info, cardX + 15, cardContentY + (index * 12));
      });

      // Proposal header section
      doc.fillColor(this.colors.primary);
      doc.fontSize(28)
         .font('Helvetica-Bold')
         .text('BUSINESS PROPOSAL', this.margins.left, headerHeight + 20);

      // Enhanced proposal metadata box
      const metaBoxY = headerHeight + 70;
      const metaBoxHeight = 60;
      
      // Gradient metadata box
      doc.rect(this.margins.left, metaBoxY, this.contentWidth, metaBoxHeight)
         .fill('#f8fafc')
         .stroke(this.colors.border);

      // Left accent stripe
      doc.rect(this.margins.left, metaBoxY, 4, metaBoxHeight)
         .fill(this.colors.primary);

      // Metadata in professional grid
      const metaItems = [
        { label: 'Proposal #', value: proposal?.proposalNumber || 'DRAFT-001' },
        { label: 'Date', value: new Date().toLocaleDateString('en-US', { 
          year: 'numeric', month: 'long', day: 'numeric' 
        })},
        { label: 'Valid Until', value: new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString('en-US', {
          year: 'numeric', month: 'long', day: 'numeric'
        })},
        { label: 'Status', value: proposal?.status?.toUpperCase() || 'DRAFT' }
      ];

      const colWidth = this.contentWidth / 2;
      metaItems.forEach((item, index) => {
        const isRightColumn = index >= 2;
        const itemX = this.margins.left + 20 + (isRightColumn ? colWidth : 0);
        const itemY = metaBoxY + 15 + ((index % 2) * 25);
        
        doc.fontSize(9)
           .font('Helvetica-Bold')
           .fillColor(this.colors.lightText)
           .text(`${item.label}:`, itemX, itemY);
        
        doc.fontSize(11)
       .font('Helvetica-Bold')
           .fillColor(item.label === 'Status' ? this.colors.primary : this.colors.text)
           .text(item.value, itemX + 80, itemY);
      });

      // Set position for content
      doc.y = metaBoxY + metaBoxHeight + 30;
      
    } catch (error) {
      console.error('❌ Error in enhanced header:', error);
    doc.fillColor(this.colors.text);
      doc.fontSize(28)
         .font('Helvetica-Bold')
         .text('BUSINESS PROPOSAL', this.margins.left, 50);
      doc.y = 120;
    }
  }

  addEnhancedContent(doc, proposal, userProfile) {
    try {
      const content = proposal?.content || {};
      
      // Ensure we have enough space before starting content
      this.checkPageSpace(doc, 80);
      
      // Enhanced Client Information Section
      this.addEnhancedSection(doc, 'CLIENT INFORMATION');
      
      const clientInfo = content.clientInfo || proposal?.clientInfo || {};
      const clientData = [
        { label: 'Client Name', value: clientInfo.name || 'Client Name' },
        { label: 'Company', value: clientInfo.company || 'Company Name' },
        { label: 'Email Address', value: clientInfo.email || 'email@company.com' },
        { label: 'Position', value: clientInfo.jobTitle || 'N/A' }
      ];

      this.addEnhancedInfoGrid(doc, clientData);
      this.addSpacing(doc, 25);

      // Executive Summary with premium styling
      if (content.executiveSummary) {
        this.addEnhancedSection(doc, 'EXECUTIVE SUMMARY');
        this.addEnhancedQuote(doc, content.executiveSummary);
        this.addSpacing(doc, 25);
      }

      // Project Overview with enhanced layout
      if (content.projectOverview) {
        this.addEnhancedSection(doc, 'PROJECT OVERVIEW');
        
        if (content.projectOverview.description) {
          this.addEnhancedSubsection(doc, 'Project Description');
          this.addEnhancedText(doc, content.projectOverview.description);
          this.addSpacing(doc, 15);
        }
        
        if (content.projectOverview.objectives && content.projectOverview.objectives.length > 0) {
          this.addEnhancedSubsection(doc, 'Key Objectives');
          this.addEnhancedBulletList(doc, content.projectOverview.objectives, '•');
          this.addSpacing(doc, 15);
        }
        
        if (content.projectOverview.scope) {
          this.addEnhancedSubsection(doc, 'Project Scope');
          this.addEnhancedText(doc, content.projectOverview.scope);
          this.addSpacing(doc, 15);
        }
        
        this.addSpacing(doc, 20);
      }

      // Solution Section with enhanced styling
      if (content.solution) {
        this.addEnhancedSection(doc, 'PROPOSED SOLUTION');
        
        if (content.solution.approach) {
          this.addEnhancedSubsection(doc, 'Our Approach');
          this.addEnhancedText(doc, content.solution.approach);
          this.addSpacing(doc, 15);
      }
      
      if (content.solution.techStack && content.solution.techStack.length > 0) {
          this.addEnhancedSubsection(doc, 'Technology Stack');
          this.addEnhancedBulletList(doc, content.solution.techStack, '•');
          this.addSpacing(doc, 15);
      }
      
      if (content.solution.deliverables && content.solution.deliverables.length > 0) {
          this.addEnhancedSubsection(doc, 'Project Deliverables');
          this.addEnhancedNumberedList(doc, content.solution.deliverables);
          this.addSpacing(doc, 15);
        }
        
        this.addSpacing(doc, 20);
      }

      // Premium Investment Section
      if (content.investment && content.investment.totalAmount) {
        this.addEnhancedSection(doc, 'INVESTMENT PROPOSAL');
        this.addPremiumInvestmentBox(doc, content.investment);
        this.addSpacing(doc, 25);
      }

      // Professional closing
      this.addEnhancedSection(doc, 'NEXT STEPS');
      this.addEnhancedText(doc, 
        'We are excited about the opportunity to partner with you on this project. This proposal represents our commitment to delivering exceptional results that align with your business objectives. Please review the details, and we welcome the opportunity to discuss any questions or modifications you may have.'
      );

      // Ensure proper ending - no extra space
      if (doc.y > doc.page.height - 150) {
        // We're close to bottom, just add footer on this page
        this.addEnhancedFooter(doc, userProfile);
      } else {
        // Add footer with some spacing
        this.addSpacing(doc, 30);
        this.addEnhancedFooter(doc, userProfile);
      }

    } catch (error) {
      console.error('❌ Error in enhanced content:', error);
      doc.fontSize(12)
         .fillColor(this.colors.text)
         .text('Error loading proposal content. Please contact support.', this.margins.left, doc.y);
      
      // Add footer even for error case
      this.addEnhancedFooter(doc, userProfile);
    }
  }

  // Enhanced helper methods for superior styling
  addEnhancedSection(doc, title) {
    this.checkPageSpace(doc, 60);
    
    const sectionY = doc.y;
    
    // Section background with subtle gradient
    doc.rect(this.margins.left - 10, sectionY - 5, this.contentWidth + 20, 35)
       .fill('#f8fafc')
       .stroke('#e2e8f0');

    // Left accent bar
    doc.rect(this.margins.left - 10, sectionY - 5, 5, 35)
       .fill(this.colors.primary);

    // Section title without icons
    doc.fontSize(18)
       .font('Helvetica-Bold')
       .fillColor(this.colors.primary)
       .text(title, this.margins.left + 5, sectionY + 5);

    doc.y = sectionY + 45;
  }

  addEnhancedSubsection(doc, title) {
    this.checkPageSpace(doc, 40);
    
    doc.fontSize(13)
       .font('Helvetica-Bold')
       .fillColor(this.colors.secondary)
       .text(title, this.margins.left, doc.y);
    
    doc.moveDown(0.5);
  }

  addEnhancedText(doc, text) {
    this.checkPageSpace(doc, 40);
    
    doc.fontSize(11)
       .font('Helvetica')
       .fillColor(this.colors.text)
       .text(text, this.margins.left, doc.y, {
         width: this.contentWidth,
         align: 'justify',
         lineGap: 5
       });
  }

  addEnhancedQuote(doc, text) {
    this.checkPageSpace(doc, 60);
    
    const quoteY = doc.y;
    
    // Quote box background
    doc.rect(this.margins.left, quoteY, this.contentWidth, 50)
       .fill('#f1f5f9')
       .stroke('#cbd5e1');

    // Quote accent
    doc.rect(this.margins.left, quoteY, 4, 50)
       .fill(this.colors.accent);

    // Quote text
    doc.fontSize(12)
       .font('Helvetica-Oblique')
       .fillColor(this.colors.text)
       .text(`"${text}"`, this.margins.left + 20, quoteY + 15, {
         width: this.contentWidth - 40,
         align: 'justify',
         lineGap: 4
       });

    doc.y = quoteY + 60;
  }

  addEnhancedBulletList(doc, items, bullet = '•') {
    items.forEach((item) => {
      this.checkPageSpace(doc, 25);
      
      doc.fontSize(11)
       .font('Helvetica-Bold')
         .fillColor(this.colors.primary)
         .text(bullet, this.margins.left, doc.y);
      
      doc.font('Helvetica')
         .fillColor(this.colors.text)
         .text(item, this.margins.left + 20, doc.y, { width: this.contentWidth - 20 });
      
      doc.moveDown(0.4);
    });
  }

  addEnhancedNumberedList(doc, items) {
    items.forEach((item, index) => {
      this.checkPageSpace(doc, 25);
      
      doc.fontSize(11)
         .font('Helvetica-Bold')
         .fillColor(this.colors.primary)
         .text(`${index + 1}.`, this.margins.left, doc.y);
      
      doc.font('Helvetica')
         .fillColor(this.colors.text)
         .text(item, this.margins.left + 25, doc.y, { width: this.contentWidth - 25 });
      
      doc.moveDown(0.4);
    });
  }

  addEnhancedInfoGrid(doc, data) {
    this.checkPageSpace(doc, data.length * 25 + 20);
    
    const gridY = doc.y;
    const rowHeight = 25;
    
    // Grid background
    doc.rect(this.margins.left, gridY, this.contentWidth, data.length * rowHeight)
       .fill('#fafafa')
       .stroke('#e5e7eb');

    data.forEach((row, index) => {
      const currentY = gridY + (index * rowHeight);
      
      // Alternating row background
      if (index % 2 === 0) {
        doc.rect(this.margins.left, currentY, this.contentWidth, rowHeight)
           .fill('#ffffff');
      }
      
      // Simple bullet instead of emoji
      doc.fontSize(12)
         .font('Helvetica')
         .fillColor(this.colors.primary)
         .text('•', this.margins.left + 10, currentY + 6);
      
      // Label
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .fillColor(this.colors.lightText)
         .text(row.label + ':', this.margins.left + 30, currentY + 6);
      
      // Value
      doc.fontSize(11)
           .font('Helvetica')
         .fillColor(this.colors.text)
         .text(row.value, this.margins.left + 140, currentY + 6, { width: this.contentWidth - 150 });
    });

    doc.y = gridY + (data.length * rowHeight) + 10;
  }

  addPremiumInvestmentBox(doc, investment) {
    this.checkPageSpace(doc, 80);
    
    const boxY = doc.y;
    const boxHeight = 70;
    
    // Premium investment box with gradient
    const gradient = doc.linearGradient(this.margins.left, boxY, this.margins.left, boxY + boxHeight);
    gradient.stop(0, '#f0f9ff');
    gradient.stop(1, '#e0f2fe');
    
    doc.rect(this.margins.left, boxY, this.contentWidth, boxHeight)
       .fill(gradient)
       .stroke(this.colors.primary);

    // Investment header without emoji
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .fillColor(this.colors.primary)
       .text('TOTAL INVESTMENT', this.margins.left + 20, boxY + 15);
    
    // Investment amount
    doc.fontSize(28)
       .font('Helvetica-Bold')
       .fillColor(this.colors.text)
       .text(
         `${investment.currency || 'USD'} $${investment.totalAmount.toLocaleString()}`,
         this.margins.left + 20,
         boxY + 35
       );

    doc.y = boxY + boxHeight + 10;
  }

  checkPageSpace(doc, requiredSpace) {
    if (doc.y + requiredSpace > doc.page.height - 100) {
      doc.addPage();
      doc.y = this.margins.top;
    }
  }

  addSpacing(doc, pixels) {
    doc.y += pixels;
  }

  addEnhancedFooter(doc, userProfile) {
    try {
      // Only add footer if we're on a page with content
      if (doc.y <= this.margins.top + 50) {
        return; // Don't add footer to empty pages
      }

      const footerY = doc.page.height - 60;
      
      // Don't add new page for footer - just position it properly
      if (doc.y > footerY - 20) {
        // If content is too close to footer, just place footer at the bottom
        doc.y = footerY;
      }

      // Premium footer separator with gradient
      const gradient = doc.linearGradient(this.margins.left, footerY - 5, this.pageWidth - this.margins.right, footerY - 5);
      gradient.stop(0, this.colors.primary);
      gradient.stop(0.5, this.colors.accent);
      gradient.stop(1, this.colors.primary);
      
      doc.moveTo(this.margins.left, footerY - 5)
         .lineTo(this.pageWidth - this.margins.right, footerY - 5)
         .lineWidth(2)
         .stroke(gradient);

      // Enhanced company branding
      const businessName = userProfile?.businessName || 
        `${userProfile?.firstName || ''} ${userProfile?.lastName || ''}`.trim() || 
        'Professional Services';
      
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .fillColor(this.colors.primary)
         .text(businessName, this.margins.left, footerY + 10);

      // Professional credentials in compact format
      const credentials = [];
      if (userProfile?.specializations && userProfile.specializations.length > 0) {
        credentials.push(...userProfile.specializations.slice(0, 2));
      }
      
      if (credentials.length > 0) {
        doc.fontSize(8)
           .font('Helvetica')
           .fillColor(this.colors.lightText)
           .text(credentials.join(' • '), this.margins.left, footerY + 25);
      }

      // Comprehensive contact information (center) without emojis
      const centerX = this.pageWidth / 2 - 80;
      const contactItems = [];
      
      if (userProfile?.email) contactItems.push(`Email: ${userProfile.email}`);
      if (userProfile?.phone) contactItems.push(`Phone: ${userProfile.phone}`);
      if (userProfile?.website) contactItems.push(`Web: ${userProfile.website}`);
      
      if (contactItems.length > 0) {
        const contactText = contactItems.join('  |  ');
        doc.fontSize(8)
           .font('Helvetica')
           .fillColor(this.colors.lightText)
           .text(contactText, centerX, footerY + 15, { width: 160, align: 'center' });
      }

      // Professional tagline and date (right)
      const rightX = this.pageWidth - 160;
      doc.fontSize(8)
         .font('Helvetica-Oblique')
         .fillColor(this.colors.lightText)
         .text('Excellence in Every Detail', rightX, footerY + 10, { width: 140, align: 'right' });

      doc.fontSize(7)
         .font('Helvetica')
         .fillColor(this.colors.lightText)
         .text(`Generated: ${new Date().toLocaleDateString()}`, rightX, footerY + 25, { width: 140, align: 'right' });

    } catch (error) {
      console.error('❌ Error in enhanced footer:', error);
      // Minimal fallback - only if there's content on the page
      if (doc.y > this.margins.top + 50) {
    doc.fontSize(8)
       .fillColor(this.colors.lightText)
           .text('Professional Business Proposal', this.margins.left, doc.page.height - 30);
      }
    }
  }
}

export default new PDFService(); 