import AddressService from './addressService.js';

export class USSDService {
  static MAIN_MENU = `
Welcome to PPOINNT - Digital Address

1. Generate PPOINNT Code
2. Search PPOINNT Code
3. Get Instructions
0. Exit

Choose option:`;

  static GENERATE_MENU = `
To generate your PPOINNT:

1. Via GPS (send location)
2. Via SMS coordinates
3. Back to menu

Choose:`;

  static SEARCH_MENU = `
Search your PPOINNT code

Enter code:`;

  static INSTRUCTIONS = `
PPOINNT Setup:
1. Dial *850#
2. Choose "Generate"
3. Share GPS or send
4. Get your code!

Or SMS: ADDR 6.5244 3.3792`;

  static parseMenuChoice(input) {
    return String(input || '').trim();
  }

  static buildResponse(menuText, sessionId = null) {
    return {
      menu: menuText,
      session_id: sessionId,
      status: 'success',
    };
  }

  static async handleGenerate(latitude, longitude, metadata = {}) {
    if (!latitude || !longitude) {
      return this.buildResponse(
        `Enter coordinates:\nLat: ${metadata.latitude || ''}\nLng: ${metadata.longitude || ''}\n\n(or 0 to cancel)`,
        metadata.sessionId
      );
    }

    try {
      const address = await AddressService.generateAddress(
        Number(latitude),
        Number(longitude),
        {
          landmark: metadata.landmark || '',
          description: `USSD generation`,
          createdBy: `USSD-${metadata.phoneNumber || 'unknown'}`,
          createdSource: 'ussd',
          addressType: 'community',
          moderationStatus: 'active',
        }
      );

      return {
        status: 'success',
        code: address.code,
        landmark: address.landmark,
        city: address.city,
        state: address.state,
        sms_message: `PPOINNT: ${address.code}\n${address.landmark || ''}\n${address.city}, ${address.state}\n\nShare: ppoint.online/p/${address.code}`,
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'Failed to generate address. Try again later.',
      };
    }
  }

  static async handleSearch(code) {
    if (!code || code.length < 5) {
      return this.buildResponse('Enter PPOINNT code (e.g., PPT-NG-LAG-IKD-1234):');
    }

    try {
      const address = await AddressService.getAddressInfo(code.toUpperCase());
      return {
        status: 'success',
        code: address.code,
        landmark: address.landmark,
        city: address.city,
        state: address.state,
        sms_message: `${address.code}\n${address.landmark || ''}\n${address.city}, ${address.state}`,
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'Code not found. Try again.',
      };
    }
  }

  static async handleSMSCommand(message) {
    const parts = message.split(/\s+/);
    const command = parts[0].toUpperCase();

    // ADDR <LAT> <LNG> - Generate address
    if (command === 'ADDR' && parts.length >= 3) {
      return this.handleGenerate(parts[1], parts[2]);
    }

    // FIND <CODE> - Search address
    if ((command === 'FIND' || command === 'SEARCH') && parts.length >= 2) {
      return this.handleSearch(parts.slice(1).join(' '));
    }

    // HELP - Show instructions
    if (command === 'HELP') {
      return {
        status: 'success',
        sms_message: `PPOINNT Commands:
ADDR <LAT> <LNG> - Create address
FIND <CODE> - Search address
HELP - This message`,
      };
    }

    return {
      status: 'error',
      sms_message: `Unknown command. Try:
ADDR 6.5244 3.3792 - Create
FIND PPT-NG-LAG-IKD-1234 - Search
HELP - Instructions`,
    };
  }

  static formatUSSDMenu(title, options, backOption = true) {
    let menu = `${title}\n\n`;
    options.forEach((opt, idx) => {
      menu += `${idx + 1}. ${opt}\n`;
    });
    if (backOption) {
      menu += `0. Back\n`;
    }
    menu += `\nChoose:`;
    return menu;
  }
}

export default USSDService;
