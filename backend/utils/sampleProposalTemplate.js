export const generateSampleProposal = (lead, userProfile, generationParams) => {
  const budgetAmount = lead.budget?.max || lead.budget?.min || 5000;
  const projectType = lead.projectType || 'Web Development';
  const businessName = userProfile.businessName || 'freelancehubr';
  const clientName = `${lead.firstName} ${lead.lastName}`;
  const companyName = lead.company || `${lead.firstName}'s Company`;

  return {
    success: true,
    content: {
      title: `${projectType} Proposal for ${companyName}`,
      executiveSummary: `We are pleased to present this comprehensive ${projectType.toLowerCase()} proposal for ${companyName}. ${businessName} specializes in delivering high-quality digital solutions that drive business growth and enhance user engagement. With our proven track record and expert team, we are confident in delivering exceptional results for your project.`,
      
      clientInfo: {
        name: clientName,
        company: companyName,
        email: lead.email,
        project: lead.description || `Custom ${projectType} solution`
      },
      
      projectOverview: {
        description: lead.description || `A comprehensive ${projectType.toLowerCase()} project designed to meet your specific business requirements and deliver exceptional value to your organization.`,
        objectives: [
          'Deliver a high-quality solution that exceeds expectations',
          'Ensure seamless user experience and optimal performance',
          'Provide comprehensive documentation and training',
          'Establish a long-term partnership for ongoing success'
        ],
        scope: `This project encompasses complete design, development, testing, and deployment of the ${projectType.toLowerCase()} solution as outlined in your requirements.`,
        requirements: 'All technical and business requirements will be thoroughly analyzed and implemented following industry best practices and modern development standards.'
      },
      
      solution: {
        approach: `We will implement an agile development methodology with regular client collaboration, ensuring your vision is brought to life through iterative development and continuous feedback integration.`,
        methodology: `Our proven development process includes comprehensive discovery, strategic planning, innovative design, robust development, thorough testing, smooth deployment, and ongoing support phases.`,
        techStack: [
          'React.js / Next.js for modern frontend development',
          'Node.js / Express.js for scalable backend API',
          'MongoDB / PostgreSQL for robust data management',
          'AWS / Vercel for reliable hosting and deployment',
          'Modern UI/UX design principles and best practices'
        ],
        deliverables: [
          'Fully functional and tested application',
          'Responsive design optimized for all devices',
          'Comprehensive admin dashboard and content management',
          'Complete source code with detailed documentation',
          'Training sessions and comprehensive user guides'
        ]
      },
      
      timeline: {
        duration: '6-8 weeks from project kickoff',
        phases: [
          {
            name: 'Discovery & Planning',
            duration: '1 week',
            description: 'Comprehensive requirements gathering, project planning, and technical architecture design'
          },
          {
            name: 'Design & Prototyping',
            duration: '1-2 weeks',
            description: 'Creative UI/UX design, detailed wireframes, and interactive prototypes'
          },
          {
            name: 'Development & Integration',
            duration: '3-4 weeks',
            description: 'Core development work, feature implementation, and system integration'
          },
          {
            name: 'Testing & Deployment',
            duration: '1 week',
            description: 'Comprehensive quality assurance, bug fixes, and production deployment'
          }
        ]
      },
      
      investment: {
        totalAmount: budgetAmount,
        currency: 'USD',
        breakdown: [
          {
            item: 'Development & Programming',
            amount: Math.round(budgetAmount * 0.6),
            description: 'Core development work, feature implementation, and backend integration'
          },
          {
            item: 'Design & User Experience',
            amount: Math.round(budgetAmount * 0.25),
            description: 'UI/UX design, branding, visual assets, and user interface development'
          },
          {
            item: 'Testing & Deployment',
            amount: Math.round(budgetAmount * 0.15),
            description: 'Quality assurance, comprehensive testing, and production deployment setup'
          }
        ],
        paymentSchedule: '30% upfront payment, 40% at project milestone, 30% upon successful completion'
      },
      
      whyChooseUs: [
        `Extensive experience with ${projectType.toLowerCase()} projects and consistently satisfied clients`,
        'Expert development team with deep technical knowledge and industry experience',
        'Agile development approach ensuring regular communication and project updates',
        'Strong commitment to quality, meeting deadlines, and providing ongoing support'
      ],
      
      termsAndConditions: [
        'Project timeline is contingent on timely client feedback and approval processes',
        'Additional features or changes outside the agreed scope will be quoted separately',
        'Client retains full ownership of all deliverables upon completion of final payment',
        'Complete source code and comprehensive documentation provided upon project completion',
        'Post-launch support period of 30 days included in the project cost'
      ],
      
      nextSteps: [
        'Review and approve this comprehensive proposal',
        'Schedule detailed project kickoff meeting with our team',
        'Execute project agreement and begin the discovery phase',
        'Establish project communication channels and milestone tracking system',
        'Begin the exciting journey of bringing your vision to life'
      ]
    },
    rawContent: `Sample ${projectType} proposal generated for ${clientName} at ${companyName} with comprehensive project details and professional presentation.`
  };
}; 