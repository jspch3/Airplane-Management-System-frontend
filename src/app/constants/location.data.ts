export const INDIAN_STATES: string[] = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

export const MAJOR_AIRPORTS: string[] = [
  'Mumbai (BOM)',
  'Delhi (DEL)',
  'Bengaluru (BLR)',
  'Hyderabad (HYD)',
  'Vijayawada (VGA)',
  'Visakhapatnam (VTZ)',
  'Chennai (MAA)',
  'Kolkata (CCU)',
  'Ahmedabad (AMD)',
  'Pune (PNQ)',
  'Goa (GOI)',
  'Kochi (COK)'
];

export interface PincodeLocation {
  city: string;
  state: string;
}

export const PINCODE_MAP: Record<string, PincodeLocation> = {
  // Andhra Pradesh
  '520001': { city: 'Vijayawada', state: 'Andhra Pradesh' },
  '520002': { city: 'Vijayawada', state: 'Andhra Pradesh' },
  '520003': { city: 'Vijayawada', state: 'Andhra Pradesh' },
  '520010': { city: 'Vijayawada', state: 'Andhra Pradesh' },
  '530001': { city: 'Visakhapatnam', state: 'Andhra Pradesh' },
  '530002': { city: 'Visakhapatnam', state: 'Andhra Pradesh' },
  '530003': { city: 'Visakhapatnam', state: 'Andhra Pradesh' },
  '530016': { city: 'Visakhapatnam', state: 'Andhra Pradesh' },
  '530020': { city: 'Visakhapatnam', state: 'Andhra Pradesh' },
  '522001': { city: 'Guntur', state: 'Andhra Pradesh' },
  '522002': { city: 'Guntur', state: 'Andhra Pradesh' },
  '517501': { city: 'Tirupati', state: 'Andhra Pradesh' },
  '517507': { city: 'Tirupati', state: 'Andhra Pradesh' },
  '518001': { city: 'Kurnool', state: 'Andhra Pradesh' },
  '518002': { city: 'Kurnool', state: 'Andhra Pradesh' },
  '533001': { city: 'Kakinada', state: 'Andhra Pradesh' },
  '533101': { city: 'Rajahmundry', state: 'Andhra Pradesh' },
  '524001': { city: 'Nellore', state: 'Andhra Pradesh' },
  '534001': { city: 'Eluru', state: 'Andhra Pradesh' },
  '515001': { city: 'Anantapur', state: 'Andhra Pradesh' },
  '516001': { city: 'Kadapa', state: 'Andhra Pradesh' },

  // Telangana
  '500001': { city: 'Hyderabad', state: 'Telangana' },
  '500002': { city: 'Hyderabad', state: 'Telangana' },
  '500003': { city: 'Hyderabad', state: 'Telangana' },
  '500032': { city: 'Hyderabad', state: 'Telangana' },
  '500081': { city: 'Hyderabad', state: 'Telangana' },
  '500084': { city: 'Hyderabad', state: 'Telangana' },
  '506001': { city: 'Warangal', state: 'Telangana' },
  '506002': { city: 'Warangal', state: 'Telangana' },
  '505001': { city: 'Karimnagar', state: 'Telangana' },
  '503001': { city: 'Nizamabad', state: 'Telangana' },
  '507001': { city: 'Khammam', state: 'Telangana' },

  // Maharashtra & Goa
  '400001': { city: 'Mumbai', state: 'Maharashtra' },
  '400002': { city: 'Mumbai', state: 'Maharashtra' },
  '400050': { city: 'Mumbai', state: 'Maharashtra' },
  '400078': { city: 'Mumbai', state: 'Maharashtra' },
  '400099': { city: 'Mumbai', state: 'Maharashtra' },
  '400601': { city: 'Thane', state: 'Maharashtra' },
  '400602': { city: 'Thane', state: 'Maharashtra' },
  '400703': { city: 'Navi Mumbai', state: 'Maharashtra' },
  '400705': { city: 'Navi Mumbai', state: 'Maharashtra' },
  '411001': { city: 'Pune', state: 'Maharashtra' },
  '411002': { city: 'Pune', state: 'Maharashtra' },
  '411014': { city: 'Pune', state: 'Maharashtra' },
  '411057': { city: 'Pune', state: 'Maharashtra' },
  '440001': { city: 'Nagpur', state: 'Maharashtra' },
  '440010': { city: 'Nagpur', state: 'Maharashtra' },
  '422001': { city: 'Nashik', state: 'Maharashtra' },
  '431001': { city: 'Aurangabad', state: 'Maharashtra' },
  '416001': { city: 'Kolhapur', state: 'Maharashtra' },
  '403001': { city: 'Panaji', state: 'Goa' },
  '403601': { city: 'Margao', state: 'Goa' },

  // Delhi NCR & Haryana
  '110001': { city: 'Delhi', state: 'Delhi' },
  '110002': { city: 'Delhi', state: 'Delhi' },
  '110020': { city: 'Delhi', state: 'Delhi' },
  '110092': { city: 'Delhi', state: 'Delhi' },
  '122001': { city: 'Gurugram', state: 'Haryana' },
  '122002': { city: 'Gurugram', state: 'Haryana' },
  '122018': { city: 'Gurugram', state: 'Haryana' },
  '121001': { city: 'Faridabad', state: 'Haryana' },
  '121002': { city: 'Faridabad', state: 'Haryana' },

  // Karnataka
  '560001': { city: 'Bengaluru', state: 'Karnataka' },
  '560002': { city: 'Bengaluru', state: 'Karnataka' },
  '560034': { city: 'Bengaluru', state: 'Karnataka' },
  '560066': { city: 'Bengaluru', state: 'Karnataka' },
  '560100': { city: 'Bengaluru', state: 'Karnataka' },
  '570001': { city: 'Mysuru', state: 'Karnataka' },
  '570002': { city: 'Mysuru', state: 'Karnataka' },
  '575001': { city: 'Mangaluru', state: 'Karnataka' },
  '580020': { city: 'Hubballi', state: 'Karnataka' },
  '590001': { city: 'Belagavi', state: 'Karnataka' },

  // Tamil Nadu & Puducherry
  '600001': { city: 'Chennai', state: 'Tamil Nadu' },
  '600002': { city: 'Chennai', state: 'Tamil Nadu' },
  '600028': { city: 'Chennai', state: 'Tamil Nadu' },
  '600040': { city: 'Chennai', state: 'Tamil Nadu' },
  '600096': { city: 'Chennai', state: 'Tamil Nadu' },
  '641001': { city: 'Coimbatore', state: 'Tamil Nadu' },
  '641002': { city: 'Coimbatore', state: 'Tamil Nadu' },
  '625001': { city: 'Madurai', state: 'Tamil Nadu' },
  '620001': { city: 'Tiruchirappalli', state: 'Tamil Nadu' },
  '636001': { city: 'Salem', state: 'Tamil Nadu' },
  '605001': { city: 'Puducherry', state: 'Puducherry' },

  // Gujarat
  '380001': { city: 'Ahmedabad', state: 'Gujarat' },
  '380002': { city: 'Ahmedabad', state: 'Gujarat' },
  '380015': { city: 'Ahmedabad', state: 'Gujarat' },
  '395001': { city: 'Surat', state: 'Gujarat' },
  '395003': { city: 'Surat', state: 'Gujarat' },
  '390001': { city: 'Vadodara', state: 'Gujarat' },
  '360001': { city: 'Rajkot', state: 'Gujarat' },
  '382010': { city: 'Gandhinagar', state: 'Gujarat' },

  // West Bengal
  '700001': { city: 'Kolkata', state: 'West Bengal' },
  '700002': { city: 'Kolkata', state: 'West Bengal' },
  '700091': { city: 'Kolkata', state: 'West Bengal' },
  '700156': { city: 'Kolkata', state: 'West Bengal' },
  '711101': { city: 'Howrah', state: 'West Bengal' },
  '734001': { city: 'Siliguri', state: 'West Bengal' },
  '713201': { city: 'Durgapur', state: 'West Bengal' },

  // Kerala
  '682001': { city: 'Kochi', state: 'Kerala' },
  '682002': { city: 'Kochi', state: 'Kerala' },
  '682030': { city: 'Kochi', state: 'Kerala' },
  '695001': { city: 'Thiruvananthapuram', state: 'Kerala' },
  '695002': { city: 'Thiruvananthapuram', state: 'Kerala' },
  '673001': { city: 'Kozhikode', state: 'Kerala' },
  '680001': { city: 'Thrissur', state: 'Kerala' },

  // Rajasthan
  '302001': { city: 'Jaipur', state: 'Rajasthan' },
  '302002': { city: 'Jaipur', state: 'Rajasthan' },
  '302017': { city: 'Jaipur', state: 'Rajasthan' },
  '342001': { city: 'Jodhpur', state: 'Rajasthan' },
  '313001': { city: 'Udaipur', state: 'Rajasthan' },
  '324001': { city: 'Kota', state: 'Rajasthan' },

  // Uttar Pradesh & Uttarakhand
  '201301': { city: 'Noida', state: 'Uttar Pradesh' },
  '201303': { city: 'Noida', state: 'Uttar Pradesh' },
  '201001': { city: 'Ghaziabad', state: 'Uttar Pradesh' },
  '226001': { city: 'Lucknow', state: 'Uttar Pradesh' },
  '226002': { city: 'Lucknow', state: 'Uttar Pradesh' },
  '208001': { city: 'Kanpur', state: 'Uttar Pradesh' },
  '282001': { city: 'Agra', state: 'Uttar Pradesh' },
  '221001': { city: 'Varanasi', state: 'Uttar Pradesh' },
  '211001': { city: 'Prayagraj', state: 'Uttar Pradesh' },
  '248001': { city: 'Dehradun', state: 'Uttarakhand' },

  // Madhya Pradesh & Chhattisgarh
  '462001': { city: 'Bhopal', state: 'Madhya Pradesh' },
  '462002': { city: 'Bhopal', state: 'Madhya Pradesh' },
  '452001': { city: 'Indore', state: 'Madhya Pradesh' },
  '452002': { city: 'Indore', state: 'Madhya Pradesh' },
  '474001': { city: 'Gwalior', state: 'Madhya Pradesh' },
  '492001': { city: 'Raipur', state: 'Chhattisgarh' },

  // Punjab, Chandigarh, HP, J&K
  '160017': { city: 'Chandigarh', state: 'Chandigarh' },
  '160022': { city: 'Chandigarh', state: 'Chandigarh' },
  '141001': { city: 'Ludhiana', state: 'Punjab' },
  '143001': { city: 'Amritsar', state: 'Punjab' },
  '134109': { city: 'Panchkula', state: 'Haryana' },
  '171001': { city: 'Shimla', state: 'Himachal Pradesh' },
  '180001': { city: 'Jammu', state: 'Jammu and Kashmir' },
  '190001': { city: 'Srinagar', state: 'Jammu and Kashmir' },

  // Bihar, Jharkhand, Odisha, Assam
  '800001': { city: 'Patna', state: 'Bihar' },
  '800002': { city: 'Patna', state: 'Bihar' },
  '834001': { city: 'Ranchi', state: 'Jharkhand' },
  '831001': { city: 'Jamshedpur', state: 'Jharkhand' },
  '751001': { city: 'Bhubaneswar', state: 'Odisha' },
  '751002': { city: 'Bhubaneswar', state: 'Odisha' },
  '753001': { city: 'Cuttack', state: 'Odisha' },
  '781001': { city: 'Guwahati', state: 'Assam' }
};

export function lookupPincode(pincode: string): PincodeLocation | null {
  if (!pincode || pincode.length !== 6) return null;

  // 1. Direct match in exact pincode map
  if (PINCODE_MAP[pincode]) {
    return PINCODE_MAP[pincode];
  }

  // 2. Fallback regional mapping based on 2-digit Indian Postal Circle prefix
  const prefix2 = pincode.substring(0, 2);

  if (prefix2 === '11') return { city: 'Delhi', state: 'Delhi' };
  if (prefix2 === '12' || prefix2 === '13') return { city: 'Gurugram', state: 'Haryana' };
  if (prefix2 === '14' || prefix2 === '15') return { city: 'Ludhiana', state: 'Punjab' };
  if (prefix2 === '16') return { city: 'Chandigarh', state: 'Chandigarh' };
  if (prefix2 === '17') return { city: 'Shimla', state: 'Himachal Pradesh' };
  if (prefix2 === '18' || prefix2 === '19') return { city: 'Srinagar', state: 'Jammu and Kashmir' };
  if (prefix2 === '20' || prefix2 === '21') return { city: 'Noida', state: 'Uttar Pradesh' };
  if (prefix2 === '22' || prefix2 === '23' || prefix2 === '24' || prefix2 === '25' || prefix2 === '26' || prefix2 === '27' || prefix2 === '28') return { city: 'Lucknow', state: 'Uttar Pradesh' };
  if (prefix2 === '30' || prefix2 === '31' || prefix2 === '32' || prefix2 === '33' || prefix2 === '34') return { city: 'Jaipur', state: 'Rajasthan' };
  if (prefix2 === '36' || prefix2 === '37' || prefix2 === '38') return { city: 'Ahmedabad', state: 'Gujarat' };
  if (prefix2 === '39') return { city: 'Surat', state: 'Gujarat' };
  if (prefix2 === '40') return { city: 'Mumbai', state: 'Maharashtra' };
  if (prefix2 === '41') return { city: 'Pune', state: 'Maharashtra' };
  if (prefix2 === '42' || prefix2 === '43') return { city: 'Nashik', state: 'Maharashtra' };
  if (prefix2 === '44') return { city: 'Nagpur', state: 'Maharashtra' };
  if (prefix2 === '45' || prefix2 === '46' || prefix2 === '47' || prefix2 === '48') return { city: 'Indore', state: 'Madhya Pradesh' };
  if (prefix2 === '49') return { city: 'Raipur', state: 'Chhattisgarh' };
  if (prefix2 === '50') return { city: 'Hyderabad', state: 'Telangana' };
  if (prefix2 === '51') return { city: 'Tirupati', state: 'Andhra Pradesh' };
  if (prefix2 === '52') return { city: 'Vijayawada', state: 'Andhra Pradesh' };
  if (prefix2 === '53') return { city: 'Visakhapatnam', state: 'Andhra Pradesh' };
  if (prefix2 === '56' || prefix2 === '57') return { city: 'Bengaluru', state: 'Karnataka' };
  if (prefix2 === '58' || prefix2 === '59') return { city: 'Hubballi', state: 'Karnataka' };
  if (prefix2 === '60' || prefix2 === '61' || prefix2 === '62' || prefix2 === '63' || prefix2 === '64') return { city: 'Chennai', state: 'Tamil Nadu' };
  if (prefix2 === '67' || prefix2 === '68' || prefix2 === '69') return { city: 'Kochi', state: 'Kerala' };
  if (prefix2 === '70' || prefix2 === '71' || prefix2 === '72' || prefix2 === '73' || prefix2 === '74') return { city: 'Kolkata', state: 'West Bengal' };
  if (prefix2 === '75' || prefix2 === '76' || prefix2 === '77') return { city: 'Bhubaneswar', state: 'Odisha' };
  if (prefix2 === '78' || prefix2 === '79') return { city: 'Guwahati', state: 'Assam' };
  if (prefix2 === '80' || prefix2 === '81' || prefix2 === '82' || prefix2 === '83' || prefix2 === '84' || prefix2 === '85') return { city: 'Patna', state: 'Bihar' };

  return null;
}
