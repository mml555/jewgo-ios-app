export interface HelpContent {
  title: string;
  description: string;
  tips?: string[];
  examples?: string[];
  commonMistakes?: string[];
  relatedFields?: string[];
}

export interface TooltipContent {
  text: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  showDelay?: number;
  hideDelay?: number;
}

class HelpContentService {
  private static instance: HelpContentService;

  static getInstance(): HelpContentService {
    if (!HelpContentService.instance) {
      HelpContentService.instance = new HelpContentService();
    }
    return HelpContentService.instance;
  }

  // Field-specific help content
  getFieldHelp(fieldName: string): HelpContent | null {
    const helpContent: Record<string, HelpContent> = {
      business_name: {
        title: 'Business Name',
        description:
          'Enter your official business name as it appears on your signage and legal documents.',
        tips: [
          'Use the exact name customers will recognize',
          'Include "Kosher" in the name if it\'s part of your official business name',
          "Avoid abbreviations unless they're part of your brand",
        ],
        examples: [
          "Goldberg's Kosher Deli",
          'Shalom Pizza',
          'The Kosher Corner Restaurant',
        ],
        commonMistakes: [
          'Using personal names instead of business names',
          'Including unnecessary words like "LLC" or "Inc."',
          'Using all caps or unusual formatting',
        ],
      },

      address: {
        title: 'Business Address',
        description:
          'Provide your complete business address including street number, street name, city, state, and zip code.',
        tips: [
          'Use the address customers use to find you',
          'Include suite or unit numbers if applicable',
          'Make sure the address matches your Google Business listing',
        ],
        examples: [
          '123 Main Street, Brooklyn, NY 11201',
          '456 Oak Avenue, Suite 2B, Los Angeles, CA 90210',
        ],
        commonMistakes: [
          'Missing zip codes',
          'Using PO Box addresses',
          'Incomplete apartment or suite numbers',
        ],
      },

      phone: {
        title: 'Business Phone',
        description:
          'Enter your main business phone number that customers can call during business hours.',
        tips: [
          'Use your main customer service line',
          'Include area code',
          "Use a number that's answered during business hours",
        ],
        examples: ['(555) 123-4567', '(212) 555-0123'],
        commonMistakes: [
          'Using personal cell phone numbers',
          'Missing area codes',
          'Using numbers that go to voicemail',
        ],
      },

      business_email: {
        title: 'Business Email',
        description:
          'Provide your business email address for customer inquiries and important communications.',
        tips: [
          'Use a professional business email address',
          'Avoid personal email addresses',
          'Make sure you check this email regularly',
        ],
        examples: [
          'info@restaurant.com',
          'orders@kosherplace.com',
          'contact@deli.net',
        ],
        commonMistakes: [
          'Using personal Gmail or Yahoo addresses',
          'Typos in email addresses',
          "Using emails that aren't monitored",
        ],
      },

      website: {
        title: 'Website URL',
        description: "Enter your restaurant's website address if you have one.",
        tips: [
          'Include the full URL starting with http:// or https://',
          'Make sure the website is current and working',
          'This helps customers find your menu and hours',
        ],
        examples: [
          'https://www.restaurant.com',
          'http://kosherplace.net',
          'https://mydeli.com',
        ],
        commonMistakes: [
          'Missing http:// or https://',
          'Broken or outdated websites',
          'Using social media links instead of websites',
        ],
      },

      kosher_category: {
        title: 'Kosher Category',
        description:
          'Select the primary kosher category that best describes your restaurant.',
        tips: [
          'Choose the category that represents most of your menu',
          'If you serve both meat and dairy, choose based on your specialty',
          'Pareve restaurants serve neither meat nor dairy',
        ],
        examples: [
          'Meat: Steakhouses, delis with pastrami',
          'Dairy: Pizza shops, ice cream parlors',
          'Pareve: Fish restaurants, vegan eateries',
        ],
        commonMistakes: [
          'Choosing multiple categories',
          'Selecting based on minor menu items',
          'Confusing kosher categories with cuisine types',
        ],
      },

      certifying_agency: {
        title: 'Kosher Certification Agency',
        description:
          'Select the organization that provides your kosher certification.',
        tips: [
          'Choose the agency whose symbol appears on your certificate',
          'If your agency isn\'t listed, select "Other" and enter it manually',
          'Make sure your certification is current',
        ],
        examples: [
          'OU (Orthodox Union)',
          'OK Kosher Certification',
          'Star-K',
          'Kof-K',
        ],
        commonMistakes: [
          'Selecting the wrong agency',
          'Not updating when certification changes',
          'Choosing based on expired certifications',
        ],
      },

      business_hours: {
        title: 'Business Hours',
        description:
          "Set your operating hours for each day of the week. Customers rely on this information to know when you're open.",
        tips: [
          'Use the toggle to mark days as open or closed',
          'Tap time fields to set opening and closing times',
          'Use "Copy" to duplicate hours to multiple days',
          'Check "Next Day" for businesses open past midnight',
        ],
        examples: [
          'Sunday-Thursday: 11:00 AM - 10:00 PM',
          'Friday: 11:00 AM - 3:00 PM (before Shabbat)',
          'Saturday: Closed',
          'Late night: 6:00 PM - 2:00 AM (next day)',
        ],
        commonMistakes: [
          'Setting closing time before opening time',
          'Forgetting to adjust for Shabbat and holidays',
          'Not updating seasonal hour changes',
          'Leaving all days closed',
        ],
      },

      short_description: {
        title: 'Short Description',
        description:
          'Write a brief, engaging description of your restaurant in 1-2 sentences.',
        tips: [
          'Mention your specialty or what makes you unique',
          'Keep it under 100 characters for best display',
          'Use friendly, inviting language',
        ],
        examples: [
          'Authentic Middle Eastern cuisine with fresh ingredients',
          'Family-owned deli serving traditional Jewish favorites',
          'Modern kosher steakhouse with elegant atmosphere',
        ],
        commonMistakes: [
          'Writing too much detail',
          'Using generic descriptions',
          'Including pricing or promotional information',
        ],
      },

      description: {
        title: 'Detailed Description',
        description:
          'Provide a comprehensive description of your restaurant, including atmosphere, specialties, and what customers can expect.',
        tips: [
          'Describe your atmosphere and dining experience',
          'Mention signature dishes or specialties',
          'Include information about your history or family tradition',
          'Keep it engaging and informative',
        ],
        examples: [
          'Our family has been serving authentic kosher cuisine for over 30 years. We specialize in traditional Jewish comfort foods made from recipes passed down through generations. Our warm, welcoming atmosphere makes every meal feel like a family gathering.',
        ],
        commonMistakes: [
          'Copying text from other websites',
          'Including outdated information',
          'Writing in third person instead of first person',
        ],
      },

      delivery_available: {
        title: 'Delivery Service',
        description: 'Indicate whether you offer food delivery to customers.',
        tips: [
          'Only check if you actually provide delivery service',
          'Consider third-party delivery services like UberEats',
          'Make sure delivery areas and fees are clear to customers',
        ],
      },

      takeout_available: {
        title: 'Takeout Service',
        description: 'Indicate whether customers can order food for pickup.',
        tips: [
          'Most restaurants offer takeout',
          'Consider if you have a separate takeout entrance',
          'Make sure takeout orders can be placed easily',
        ],
      },

      catering_available: {
        title: 'Catering Service',
        description:
          'Indicate whether you provide catering for events and parties.',
        tips: [
          'Only check if you actively offer catering services',
          'Consider minimum order requirements',
          'Think about your capacity for large orders',
        ],
      },

      business_images: {
        title: 'Restaurant Photos',
        description:
          'Upload high-quality photos that showcase your restaurant, food, and atmosphere.',
        tips: [
          'Include exterior shots showing your storefront',
          'Take photos of your dining area and atmosphere',
          'Show your signature dishes and popular menu items',
          'Use good lighting - natural light works best',
          'Take multiple shots and choose the best ones',
        ],
        examples: [
          'Storefront with clear signage',
          'Interior dining room',
          'Kitchen or food preparation area',
          'Signature dishes beautifully plated',
          'Happy customers dining',
        ],
        commonMistakes: [
          'Using blurry or dark photos',
          'Including photos with people without permission',
          'Using stock photos instead of actual restaurant photos',
          'Uploading too few photos (minimum 3 required)',
        ],
      },
    };

    return helpContent[fieldName] || null;
  }

  // Tooltip content for quick help
  getTooltip(fieldName: string): TooltipContent | null {
    const tooltips: Record<string, TooltipContent> = {
      business_name: {
        text: 'Enter your official business name as customers know it',
        placement: 'top',
      },

      address: {
        text: 'Complete address including zip code',
        placement: 'top',
      },

      phone: {
        text: 'Format: (555) 123-4567',
        placement: 'top',
      },

      business_email: {
        text: 'Use a professional business email address',
        placement: 'top',
      },

      website: {
        text: 'Include http:// or https://',
        placement: 'top',
      },

      kosher_category: {
        text: 'Choose based on your primary menu offerings',
        placement: 'right',
      },

      certifying_agency: {
        text: 'Select the agency on your kosher certificate',
        placement: 'right',
      },

      is_cholov_yisroel: {
        text: 'Check if you use only Cholov Yisroel dairy products',
        placement: 'left',
      },

      is_pas_yisroel: {
        text: 'Check if your baked goods are Pas Yisroel',
        placement: 'left',
      },

      business_hours_open_toggle: {
        text: 'Toggle to mark this day as open or closed',
        placement: 'top',
      },

      business_hours_time: {
        text: 'Tap to set opening or closing time',
        placement: 'bottom',
      },

      business_hours_next_day: {
        text: 'Check if you close after midnight',
        placement: 'left',
      },

      business_hours_copy: {
        text: 'Copy these hours to other days',
        placement: 'left',
      },

      short_description: {
        text: 'Brief description (under 100 characters)',
        placement: 'top',
      },

      description: {
        text: 'Detailed description of your restaurant and specialties',
        placement: 'top',
      },

      delivery_available: {
        text: 'Check if you offer delivery service',
        placement: 'left',
      },

      takeout_available: {
        text: 'Check if customers can order for pickup',
        placement: 'left',
      },

      catering_available: {
        text: 'Check if you provide catering services',
        placement: 'left',
      },

      instagram_link: {
        text: 'Your Instagram username (without @)',
        placement: 'top',
      },

      facebook_link: {
        text: 'Your Facebook page URL or username',
        placement: 'top',
      },

      business_images: {
        text: 'Upload 3-10 high-quality photos (max 5MB each)',
        placement: 'top',
      },
    };

    return tooltips[fieldName] || null;
  }

  // Step-specific help content
  getStepHelp(stepNumber: number): HelpContent | null {
    const stepHelp: Record<number, HelpContent> = {
      1: {
        title: 'Basic Information',
        description:
          'Provide essential business details that customers need to find and contact you.',
        tips: [
          'Use information that matches your official business documents',
          'Ensure contact details are current and monitored',
          'Choose the business type that best describes your operation',
        ],
      },

      2: {
        title: 'Kosher Certification',
        description:
          'Specify your kosher status and certification details to help customers find restaurants that meet their dietary requirements.',
        tips: [
          'Select the category that represents most of your menu',
          'Choose the certifying agency that appears on your certificate',
          'Check additional designations that apply to your restaurant',
        ],
      },

      3: {
        title: 'Business Details & Hours',
        description:
          'Set your operating schedule and describe your restaurant to help customers know what to expect.',
        tips: [
          'Set accurate hours that reflect your actual operations',
          'Write descriptions that highlight what makes you special',
          'Include services you offer to attract more customers',
        ],
      },

      4: {
        title: 'Photos',
        description:
          'Upload appealing photos that showcase your restaurant and food to attract customers.',
        tips: [
          'Use high-quality, well-lit photos',
          'Include variety: exterior, interior, and food photos',
          'Show your restaurant at its best',
        ],
      },

      5: {
        title: 'Review & Submit',
        description:
          'Review all your information for accuracy before submitting your listing.',
        tips: [
          'Double-check all contact information',
          'Verify business hours are correct',
          'Ensure photos represent your current restaurant',
        ],
      },
    };

    return stepHelp[stepNumber] || null;
  }

  // Contextual help based on validation errors
  getValidationHelp(fieldName: string, errorType: string): HelpContent | null {
    const validationHelp: Record<string, Record<string, HelpContent>> = {
      business_name: {
        required: {
          title: 'Business Name Required',
          description: 'You must enter your business name to continue.',
          tips: ['Enter the name customers use to find your restaurant'],
        },
        too_short: {
          title: 'Business Name Too Short',
          description: 'Business names should be at least 2 characters long.',
          tips: ['Use your full business name, not abbreviations'],
        },
      },

      phone: {
        invalid_format: {
          title: 'Invalid Phone Format',
          description: 'Please enter a valid phone number.',
          tips: ['Use format: (555) 123-4567', 'Include area code'],
          examples: ['(212) 555-0123', '(555) 123-4567'],
        },
      },

      business_email: {
        invalid_format: {
          title: 'Invalid Email Format',
          description: 'Please enter a valid email address.',
          tips: ['Must include @ symbol', 'Use a business email if possible'],
          examples: ['info@restaurant.com', 'contact@deli.net'],
        },
      },

      business_hours: {
        no_days_open: {
          title: 'No Operating Days',
          description:
            'Your restaurant must be open at least one day per week.',
          tips: [
            'Toggle at least one day to "Open"',
            'Set opening and closing times',
          ],
        },
        invalid_times: {
          title: 'Invalid Business Hours',
          description: 'Opening time must be before closing time.',
          tips: ['Check AM/PM settings', 'Use "Next Day" for late-night hours'],
        },
      },
    };

    return validationHelp[fieldName]?.[errorType] || null;
  }

  // Progressive disclosure help - show more detailed help as user progresses
  getProgressiveHelp(
    fieldName: string,
    interactionCount: number,
  ): HelpContent | null {
    // Show more detailed help after user has interacted with field multiple times
    if (interactionCount < 3) {
      return this.getTooltip(fieldName)
        ? {
            title: '',
            description: this.getTooltip(fieldName)!.text,
          }
        : null;
    }

    return this.getFieldHelp(fieldName);
  }

  // Search help content
  searchHelp(query: string): HelpContent[] {
    const fieldHelp = this.getFieldHelp('');
    const stepHelp = this.getStepHelp(0);

    const allHelp = [
      ...(fieldHelp
        ? Object.keys(fieldHelp).map(field => this.getFieldHelp(field)!)
        : []),
      ...(stepHelp
        ? Object.keys(stepHelp).map(
            step => this.getStepHelp(parseInt(step, 10))!,
          )
        : []),
    ].filter(Boolean);

    return allHelp.filter(
      help =>
        help.title.toLowerCase().includes(query.toLowerCase()) ||
        help.description.toLowerCase().includes(query.toLowerCase()) ||
        help.tips?.some(tip => tip.toLowerCase().includes(query.toLowerCase())),
    );
  }
}

export default HelpContentService;
