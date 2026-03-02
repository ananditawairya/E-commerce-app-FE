
/**
 * Hierarchical country/state/city data with postal code patterns.
 * @type {Record<string, {states: Record<string, {cities: string[], zipPattern: RegExp}>}>}
 */
export const LOCATION_DATA = {
  India: {
    states: {
      'Andhra Pradesh': {
        cities: ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Kurnool', 'Rajahmundry', 'Tirupati', 'Kadapa', 'Anantapur', 'Vizianagaram'],
        zipPattern: /^5[0-3]\d{4}$/,
      },
      'Arunachal Pradesh': {
        cities: ['Itanagar', 'Naharlagun', 'Pasighat', 'Tawang', 'Ziro', 'Bomdila', 'Tezu', 'Seppa', 'Changlang', 'Roing'],
        zipPattern: /^79\d{4}$/,
      },
      Assam: {
        cities: ['Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat', 'Nagaon', 'Tinsukia', 'Tezpur', 'Bongaigaon', 'Karimganj', 'Dhubri'],
        zipPattern: /^78\d{4}$/,
      },
      Bihar: {
        cities: ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Purnia', 'Darbhanga', 'Bihar Sharif', 'Arrah', 'Begusarai', 'Katihar'],
        zipPattern: /^8[0-5]\d{4}$/,
      },
      Chhattisgarh: {
        cities: ['Raipur', 'Bhilai', 'Bilaspur', 'Korba', 'Durg', 'Rajnandgaon', 'Jagdalpur', 'Raigarh', 'Ambikapur', 'Dhamtari'],
        zipPattern: /^49\d{4}$/,
      },
      Goa: {
        cities: ['Panaji', 'Margao', 'Vasco da Gama', 'Mapusa', 'Ponda', 'Bicholim', 'Curchorem', 'Sanquelim', 'Cuncolim', 'Quepem'],
        zipPattern: /^403\d{3}$/,
      },
      Gujarat: {
        cities: ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Junagadh', 'Gandhinagar', 'Anand', 'Nadiad'],
        zipPattern: /^3[6-9]\d{4}$/,
      },
      Haryana: {
        cities: ['Faridabad', 'Gurgaon', 'Panipat', 'Ambala', 'Yamunanagar', 'Rohtak', 'Hisar', 'Karnal', 'Sonipat', 'Panchkula'],
        zipPattern: /^1[2-3]\d{4}$/,
      },
      'Himachal Pradesh': {
        cities: ['Shimla', 'Dharamshala', 'Solan', 'Mandi', 'Palampur', 'Kullu', 'Hamirpur', 'Bilaspur', 'Chamba', 'Una'],
        zipPattern: /^17\d{4}$/,
      },
      Jharkhand: {
        cities: ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Deoghar', 'Hazaribagh', 'Giridih', 'Ramgarh', 'Medininagar', 'Chirkunda'],
        zipPattern: /^8[2-3]\d{4}$/,
      },
      Karnataka: {
        cities: ['Bangalore', 'Mysore', 'Hubli', 'Mangalore', 'Belgaum', 'Gulbarga', 'Davanagere', 'Bellary', 'Bijapur', 'Shimoga'],
        zipPattern: /^5[6-7]\d{4}$/,
      },
      Kerala: {
        cities: ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur', 'Kollam', 'Palakkad', 'Alappuzha', 'Kannur', 'Kottayam', 'Malappuram'],
        zipPattern: /^6[7-9]\d{4}$/,
      },
      'Madhya Pradesh': {
        cities: ['Indore', 'Bhopal', 'Jabalpur', 'Gwalior', 'Ujjain', 'Sagar', 'Dewas', 'Satna', 'Ratlam', 'Rewa'],
        zipPattern: /^4[5-8]\d{4}$/,
      },
      Maharashtra: {
        cities: ['Mumbai', 'Pune', 'Nagpur', 'Thane', 'Nashik', 'Aurangabad', 'Solapur', 'Amravati', 'Kolhapur', 'Nanded'],
        zipPattern: /^4[0-4]\d{4}$/,
      },
      Manipur: {
        cities: ['Imphal', 'Thoubal', 'Bishnupur', 'Churachandpur', 'Kakching', 'Ukhrul', 'Senapati', 'Tamenglong', 'Jiribam', 'Moreh'],
        zipPattern: /^795\d{3}$/,
      },
      Meghalaya: {
        cities: ['Shillong', 'Tura', 'Nongstoin', 'Jowai', 'Baghmara', 'Williamnagar', 'Nongpoh', 'Mairang', 'Resubelpara', 'Ampati'],
        zipPattern: /^793\d{3}$/,
      },
      Mizoram: {
        cities: ['Aizawl', 'Lunglei', 'Champhai', 'Serchhip', 'Kolasib', 'Lawngtlai', 'Saiha', 'Mamit', 'Hnahthial', 'Khawzawl'],
        zipPattern: /^796\d{3}$/,
      },
      Nagaland: {
        cities: ['Kohima', 'Dimapur', 'Mokokchung', 'Tuensang', 'Wokha', 'Zunheboto', 'Phek', 'Mon', 'Longleng', 'Kiphire'],
        zipPattern: /^797\d{3}$/,
      },
      Odisha: {
        cities: ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Brahmapur', 'Sambalpur', 'Puri', 'Balasore', 'Bhadrak', 'Baripada', 'Jharsuguda'],
        zipPattern: /^7[5-7]\d{4}$/,
      },
      Punjab: {
        cities: ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Mohali', 'Pathankot', 'Hoshiarpur', 'Batala', 'Moga'],
        zipPattern: /^1[4-6]\d{4}$/,
      },
      Rajasthan: {
        cities: ['Jaipur', 'Jodhpur', 'Kota', 'Bikaner', 'Ajmer', 'Udaipur', 'Bhilwara', 'Alwar', 'Bharatpur', 'Sikar'],
        zipPattern: /^3[0-4]\d{4}$/,
      },
      Sikkim: {
        cities: ['Gangtok', 'Namchi', 'Gyalshing', 'Mangan', 'Rangpo', 'Jorethang', 'Singtam', 'Ravangla', 'Pelling', 'Yuksom'],
        zipPattern: /^737\d{3}$/,
      },
      'Tamil Nadu': {
        cities: ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirunelveli', 'Tiruppur', 'Erode', 'Vellore', 'Thoothukudi'],
        zipPattern: /^6[0-4]\d{4}$/,
      },
      Telangana: {
        cities: ['Hyderabad', 'Warangal', 'Nizamabad', 'Khammam', 'Karimnagar', 'Ramagundam', 'Mahbubnagar', 'Nalgonda', 'Adilabad', 'Suryapet'],
        zipPattern: /^5[0-0]\d{4}$/,
      },
      Tripura: {
        cities: ['Agartala', 'Udaipur', 'Dharmanagar', 'Kailashahar', 'Belonia', 'Khowai', 'Ambassa', 'Teliamura', 'Sabroom', 'Sonamura'],
        zipPattern: /^799\d{3}$/,
      },
      'Uttar Pradesh': {
        cities: ['Lucknow', 'Kanpur', 'Ghaziabad', 'Agra', 'Varanasi', 'Meerut', 'Allahabad', 'Bareilly', 'Aligarh', 'Moradabad'],
        zipPattern: /^2[0-8]\d{4}$/,
      },
      Uttarakhand: {
        cities: ['Dehradun', 'Haridwar', 'Roorkee', 'Haldwani', 'Rudrapur', 'Kashipur', 'Rishikesh', 'Pithoragarh', 'Nainital', 'Almora'],
        zipPattern: /^24\d{4}$/,
      },
      'West Bengal': {
        cities: ['Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri', 'Bardhaman', 'Malda', 'Baharampur', 'Habra', 'Kharagpur'],
        zipPattern: /^7[0-4]\d{4}$/,
      },
      'Andaman and Nicobar Islands': {
        cities: ['Port Blair', 'Diglipur', 'Rangat', 'Mayabunder', 'Car Nicobar', 'Hut Bay', 'Nancowry', 'Campbell Bay', 'Bambooflat', 'Garacharma'],
        zipPattern: /^744\d{3}$/,
      },
      Chandigarh: {
        cities: ['Chandigarh'],
        zipPattern: /^160\d{3}$/,
      },
      'Dadra and Nagar Haveli and Daman and Diu': {
        cities: ['Daman', 'Diu', 'Silvassa'],
        zipPattern: /^39[6-7]\d{3}$/,
      },
      Delhi: {
        cities: ['New Delhi', 'North Delhi', 'South Delhi', 'East Delhi', 'West Delhi', 'Central Delhi', 'North East Delhi', 'North West Delhi', 'South East Delhi', 'South West Delhi'],
        zipPattern: /^1[1-1]\d{4}$/,
      },
      Jammu: {
        cities: ['Jammu', 'Srinagar', 'Anantnag', 'Baramulla', 'Udhampur', 'Kathua', 'Rajouri', 'Poonch', 'Doda', 'Ramban'],
        zipPattern: /^1[8-9]\d{4}$/,
      },
      Ladakh: {
        cities: ['Leh', 'Kargil', 'Nubra', 'Zanskar', 'Drass', 'Nyoma', 'Khalsi', 'Diskit', 'Padum', 'Sankoo'],
        zipPattern: /^194\d{3}$/,
      },
      Lakshadweep: {
        cities: ['Kavaratti', 'Agatti', 'Amini', 'Andrott', 'Kalpeni', 'Kadmat', 'Kiltan', 'Chetlat', 'Bitra', 'Minicoy'],
        zipPattern: /^682\d{3}$/,
      },
      Puducherry: {
        cities: ['Puducherry', 'Karaikal', 'Mahe', 'Yanam'],
        zipPattern: /^605\d{3}$/,
      },
    },
  },
  'United States': {
    states: {
      Alabama: {
        cities: ['Birmingham', 'Montgomery', 'Mobile', 'Huntsville', 'Tuscaloosa', 'Hoover', 'Dothan', 'Auburn', 'Decatur', 'Madison'],
        zipPattern: /^3[5-6]\d{3}$/,
      },
      Alaska: {
        cities: ['Anchorage', 'Fairbanks', 'Juneau', 'Sitka', 'Ketchikan', 'Wasilla', 'Kenai', 'Kodiak', 'Bethel', 'Palmer'],
        zipPattern: /^99[5-9]\d{2}$/,
      },
      Arizona: {
        cities: ['Phoenix', 'Tucson', 'Mesa', 'Chandler', 'Scottsdale', 'Glendale', 'Gilbert', 'Tempe', 'Peoria', 'Surprise'],
        zipPattern: /^8[5-6]\d{3}$/,
      },
      Arkansas: {
        cities: ['Little Rock', 'Fort Smith', 'Fayetteville', 'Springdale', 'Jonesboro', 'North Little Rock', 'Conway', 'Rogers', 'Pine Bluff', 'Bentonville'],
        zipPattern: /^7[1-2]\d{3}$/,
      },
      California: {
        cities: ['Los Angeles', 'San Diego', 'San Jose', 'San Francisco', 'Fresno', 'Sacramento', 'Long Beach', 'Oakland', 'Bakersfield', 'Anaheim'],
        zipPattern: /^9[0-6]\d{3}$/,
      },
      Colorado: {
        cities: ['Denver', 'Colorado Springs', 'Aurora', 'Fort Collins', 'Lakewood', 'Thornton', 'Arvada', 'Westminster', 'Pueblo', 'Centennial'],
        zipPattern: /^8[0-1]\d{3}$/,
      },
      Connecticut: {
        cities: ['Bridgeport', 'New Haven', 'Stamford', 'Hartford', 'Waterbury', 'Norwalk', 'Danbury', 'New Britain', 'Bristol', 'Meriden'],
        zipPattern: /^06\d{3}$/,
      },
      Delaware: {
        cities: ['Wilmington', 'Dover', 'Newark', 'Middletown', 'Smyrna', 'Milford', 'Seaford', 'Georgetown', 'Elsmere', 'New Castle'],
        zipPattern: /^19[7-9]\d{2}$/,
      },
      Florida: {
        cities: ['Jacksonville', 'Miami', 'Tampa', 'Orlando', 'St. Petersburg', 'Hialeah', 'Tallahassee', 'Fort Lauderdale', 'Port St. Lucie', 'Cape Coral'],
        zipPattern: /^3[2-4]\d{3}$/,
      },
      Georgia: {
        cities: ['Atlanta', 'Augusta', 'Columbus', 'Macon', 'Savannah', 'Athens', 'Sandy Springs', 'Roswell', 'Johns Creek', 'Albany'],
        zipPattern: /^3[0-1]\d{3}$/,
      },
      Hawaii: {
        cities: ['Honolulu', 'Pearl City', 'Hilo', 'Kailua', 'Waipahu', 'Kaneohe', 'Mililani Town', 'Kahului', 'Ewa Gentry', 'Kihei'],
        zipPattern: /^967\d{2}$/,
      },
      Idaho: {
        cities: ['Boise', 'Meridian', 'Nampa', 'Idaho Falls', 'Pocatello', 'Caldwell', 'Coeur d\'Alene', 'Twin Falls', 'Lewiston', 'Post Falls'],
        zipPattern: /^83[2-8]\d{2}$/,
      },
      Illinois: {
        cities: ['Chicago', 'Aurora', 'Rockford', 'Joliet', 'Naperville', 'Springfield', 'Peoria', 'Elgin', 'Waukegan', 'Cicero'],
        zipPattern: /^6[0-2]\d{3}$/,
      },
      Indiana: {
        cities: ['Indianapolis', 'Fort Wayne', 'Evansville', 'South Bend', 'Carmel', 'Bloomington', 'Fishers', 'Hammond', 'Gary', 'Muncie'],
        zipPattern: /^4[6-7]\d{3}$/,
      },
      Iowa: {
        cities: ['Des Moines', 'Cedar Rapids', 'Davenport', 'Sioux City', 'Iowa City', 'Waterloo', 'Council Bluffs', 'Ames', 'West Des Moines', 'Dubuque'],
        zipPattern: /^5[0-2]\d{3}$/,
      },
      Kansas: {
        cities: ['Wichita', 'Overland Park', 'Kansas City', 'Olathe', 'Topeka', 'Lawrence', 'Shawnee', 'Manhattan', 'Lenexa', 'Salina'],
        zipPattern: /^6[6-7]\d{3}$/,
      },
      Kentucky: {
        cities: ['Louisville', 'Lexington', 'Bowling Green', 'Owensboro', 'Covington', 'Richmond', 'Georgetown', 'Florence', 'Hopkinsville', 'Nicholasville'],
        zipPattern: /^4[0-2]\d{3}$/,
      },
      Louisiana: {
        cities: ['New Orleans', 'Baton Rouge', 'Shreveport', 'Lafayette', 'Lake Charles', 'Kenner', 'Bossier City', 'Monroe', 'Alexandria', 'Houma'],
        zipPattern: /^7[0-1]\d{3}$/,
      },
      Maine: {
        cities: ['Portland', 'Lewiston', 'Bangor', 'South Portland', 'Auburn', 'Biddeford', 'Sanford', 'Saco', 'Augusta', 'Westbrook'],
        zipPattern: /^04\d{3}$/,
      },
      Maryland: {
        cities: ['Baltimore', 'Columbia', 'Germantown', 'Silver Spring', 'Waldorf', 'Glen Burnie', 'Ellicott City', 'Frederick', 'Rockville', 'Gaithersburg'],
        zipPattern: /^2[0-1]\d{3}$/,
      },
      Massachusetts: {
        cities: ['Boston', 'Worcester', 'Springfield', 'Cambridge', 'Lowell', 'Brockton', 'Quincy', 'Lynn', 'New Bedford', 'Fall River'],
        zipPattern: /^0[1-2]\d{3}$/,
      },
      Michigan: {
        cities: ['Detroit', 'Grand Rapids', 'Warren', 'Sterling Heights', 'Ann Arbor', 'Lansing', 'Flint', 'Dearborn', 'Livonia', 'Clinton Township'],
        zipPattern: /^4[8-9]\d{3}$/,
      },
      Minnesota: {
        cities: ['Minneapolis', 'St. Paul', 'Rochester', 'Duluth', 'Bloomington', 'Brooklyn Park', 'Plymouth', 'St. Cloud', 'Eagan', 'Woodbury'],
        zipPattern: /^5[5-6]\d{3}$/,
      },
      Mississippi: {
        cities: ['Jackson', 'Gulfport', 'Southaven', 'Hattiesburg', 'Biloxi', 'Meridian', 'Tupelo', 'Greenville', 'Olive Branch', 'Horn Lake'],
        zipPattern: /^38[6-9]\d{2}$/,
      },
      Missouri: {
        cities: ['Kansas City', 'St. Louis', 'Springfield', 'Columbia', 'Independence', 'Lee\'s Summit', 'O\'Fallon', 'St. Joseph', 'St. Charles', 'St. Peters'],
        zipPattern: /^6[3-5]\d{3}$/,
      },
      Montana: {
        cities: ['Billings', 'Missoula', 'Great Falls', 'Bozeman', 'Butte', 'Helena', 'Kalispell', 'Havre', 'Anaconda', 'Miles City'],
        zipPattern: /^59\d{3}$/,
      },
      Nebraska: {
        cities: ['Omaha', 'Lincoln', 'Bellevue', 'Grand Island', 'Kearney', 'Fremont', 'Hastings', 'Norfolk', 'Columbus', 'Papillion'],
        zipPattern: /^6[8-9]\d{3}$/,
      },
      Nevada: {
        cities: ['Las Vegas', 'Henderson', 'Reno', 'North Las Vegas', 'Sparks', 'Carson City', 'Fernley', 'Elko', 'Mesquite', 'Boulder City'],
        zipPattern: /^89[0-8]\d{2}$/,
      },
      'New Hampshire': {
        cities: ['Manchester', 'Nashua', 'Concord', 'Derry', 'Rochester', 'Salem', 'Dover', 'Merrimack', 'Londonderry', 'Hudson'],
        zipPattern: /^03\d{3}$/,
      },
      'New Jersey': {
        cities: ['Newark', 'Jersey City', 'Paterson', 'Elizabeth', 'Edison', 'Woodbridge', 'Lakewood', 'Toms River', 'Hamilton', 'Trenton'],
        zipPattern: /^0[7-8]\d{3}$/,
      },
      'New Mexico': {
        cities: ['Albuquerque', 'Las Cruces', 'Rio Rancho', 'Santa Fe', 'Roswell', 'Farmington', 'Clovis', 'Hobbs', 'Alamogordo', 'Carlsbad'],
        zipPattern: /^8[7-8]\d{3}$/,
      },
      'New York': {
        cities: ['New York City', 'Buffalo', 'Rochester', 'Yonkers', 'Syracuse', 'Albany', 'New Rochelle', 'Mount Vernon', 'Schenectady', 'Utica'],
        zipPattern: /^1[0-4]\d{3}$/,
      },
      'North Carolina': {
        cities: ['Charlotte', 'Raleigh', 'Greensboro', 'Durham', 'Winston-Salem', 'Fayetteville', 'Cary', 'Wilmington', 'High Point', 'Concord'],
        zipPattern: /^2[7-8]\d{3}$/,
      },
      'North Dakota': {
        cities: ['Fargo', 'Bismarck', 'Grand Forks', 'Minot', 'West Fargo', 'Williston', 'Dickinson', 'Mandan', 'Jamestown', 'Wahpeton'],
        zipPattern: /^58\d{3}$/,
      },
      Ohio: {
        cities: ['Columbus', 'Cleveland', 'Cincinnati', 'Toledo', 'Akron', 'Dayton', 'Parma', 'Canton', 'Youngstown', 'Lorain'],
        zipPattern: /^4[3-5]\d{3}$/,
      },
      Oklahoma: {
        cities: ['Oklahoma City', 'Tulsa', 'Norman', 'Broken Arrow', 'Edmond', 'Lawton', 'Moore', 'Midwest City', 'Enid', 'Stillwater'],
        zipPattern: /^7[3-4]\d{3}$/,
      },
      Oregon: {
        cities: ['Portland', 'Eugene', 'Salem', 'Gresham', 'Hillsboro', 'Beaverton', 'Bend', 'Medford', 'Springfield', 'Corvallis'],
        zipPattern: /^97\d{3}$/,
      },
      Pennsylvania: {
        cities: ['Philadelphia', 'Pittsburgh', 'Allentown', 'Erie', 'Reading', 'Scranton', 'Bethlehem', 'Lancaster', 'Harrisburg', 'Altoona'],
        zipPattern: /^1[5-9]\d{3}$/,
      },
      'Rhode Island': {
        cities: ['Providence', 'Warwick', 'Cranston', 'Pawtucket', 'East Providence', 'Woonsocket', 'Coventry', 'Cumberland', 'North Providence', 'South Kingstown'],
        zipPattern: /^02[8-9]\d{2}$/,
      },
      'South Carolina': {
        cities: ['Charleston', 'Columbia', 'North Charleston', 'Mount Pleasant', 'Rock Hill', 'Greenville', 'Summerville', 'Sumter', 'Goose Creek', 'Hilton Head Island'],
        zipPattern: /^29\d{3}$/,
      },
      'South Dakota': {
        cities: ['Sioux Falls', 'Rapid City', 'Aberdeen', 'Brookings', 'Watertown', 'Mitchell', 'Yankton', 'Pierre', 'Huron', 'Vermillion'],
        zipPattern: /^57\d{3}$/,
      },
      Tennessee: {
        cities: ['Nashville', 'Memphis', 'Knoxville', 'Chattanooga', 'Clarksville', 'Murfreesboro', 'Franklin', 'Jackson', 'Johnson City', 'Bartlett'],
        zipPattern: /^3[7-8]\d{3}$/,
      },
      Texas: {
        cities: ['Houston', 'San Antonio', 'Dallas', 'Austin', 'Fort Worth', 'El Paso', 'Arlington', 'Corpus Christi', 'Plano', 'Laredo'],
        zipPattern: /^7[5-9]\d{3}$/,
      },
      Utah: {
        cities: ['Salt Lake City', 'West Valley City', 'Provo', 'West Jordan', 'Orem', 'Sandy', 'Ogden', 'St. George', 'Layton', 'Taylorsville'],
        zipPattern: /^84\d{3}$/,
      },
      Vermont: {
        cities: ['Burlington', 'South Burlington', 'Rutland', 'Barre', 'Montpelier', 'Winooski', 'St. Albans', 'Newport', 'Vergennes', 'Brattleboro'],
        zipPattern: /^05\d{3}$/,
      },
      Virginia: {
        cities: ['Virginia Beach', 'Norfolk', 'Chesapeake', 'Richmond', 'Newport News', 'Alexandria', 'Hampton', 'Roanoke', 'Portsmouth', 'Suffolk'],
        zipPattern: /^2[2-4]\d{3}$/,
      },
      Washington: {
        cities: ['Seattle', 'Spokane', 'Tacoma', 'Vancouver', 'Bellevue', 'Kent', 'Everett', 'Renton', 'Spokane Valley', 'Federal Way'],
        zipPattern: /^98\d{3}$/,
      },
      'West Virginia': {
        cities: ['Charleston', 'Huntington', 'Morgantown', 'Parkersburg', 'Wheeling', 'Weirton', 'Fairmont', 'Martinsburg', 'Beckley', 'Clarksburg'],
        zipPattern: /^2[5-6]\d{3}$/,
      },
      Wisconsin: {
        cities: ['Milwaukee', 'Madison', 'Green Bay', 'Kenosha', 'Racine', 'Appleton', 'Waukesha', 'Eau Claire', 'Oshkosh', 'Janesville'],
        zipPattern: /^5[3-4]\d{3}$/,
      },
      Wyoming: {
        cities: ['Cheyenne', 'Casper', 'Laramie', 'Gillette', 'Rock Springs', 'Sheridan', 'Green River', 'Evanston', 'Riverton', 'Jackson'],
        zipPattern: /^82\d{3}$/,
      },
    },
  },
};

/**
 * Returns a sorted list of states for a country.
 * @param {string} country Country name key.
 * @return {string[]} Sorted state names.
 */
export const getStatesForCountry = (country) => {
  if (!country || !LOCATION_DATA[country]) {
    return [];
  }
  return Object.keys(LOCATION_DATA[country].states).sort();
};

/**
 * Returns a sorted list of cities for a specific country and state.
 * @param {string} country Country name key.
 * @param {string} state State name key.
 * @return {string[]} Sorted city names.
 */
export const getCitiesForState = (country, state) => {
  if (!country || !state || !LOCATION_DATA[country]?.states[state]) {
    return [];
  }
  return LOCATION_DATA[country].states[state].cities.sort();
};

/**
 * Validates ZIP/PIN code against country and state pattern.
 * @param {string} country Country name key.
 * @param {string} state State name key.
 * @param {string} zipCode Postal code value.
 * @return {{isValid: boolean, error: string}} Validation result.
 */
export const validateZipCodeForCity = (country, state, zipCode) => {
  if (!country || !state || !zipCode) {
    return { isValid: false, error: 'Country, state, and ZIP code are required' };
  }

  const stateData = LOCATION_DATA[country]?.states[state];
  if (!stateData) {
    return { isValid: false, error: 'Invalid country or state' };
  }

  const cleanZip = zipCode.trim();
  if (!cleanZip) {
    return { isValid: false, error: 'ZIP code is required' };
  }

  if (!stateData.zipPattern.test(cleanZip)) {
    return {
      isValid: false,
      error: `Invalid ZIP code for ${state}. Please enter a valid ${country === 'India' ? 'PIN code' : 'ZIP code'}.`,
    };
  }

  return { isValid: true, error: '' };
};
