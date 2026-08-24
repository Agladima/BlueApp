const countries = []

function add(continent, region, list) {
  list.forEach(([name, capital, code]) => {
    countries.push({
      id: `${continent.slice(0, 2).toUpperCase()}-${code}`,
      name,
      capital,
      code,
      continent,
      region,
    })
  })
}

add('Africa', 'West Africa', [['Nigeria', 'Abuja', 'NG'], ['Ghana', 'Accra', 'GH'], ['Senegal', 'Dakar', 'SN'], ['Gambia', 'Banjul', 'GM'], ['Sierra Leone', 'Freetown', 'SL'], ['Liberia', 'Monrovia', 'LR'], ['Guinea', 'Conakry', 'GN'], ['Guinea-Bissau', 'Bissau', 'GW'], ['Ivory Coast', 'Yamoussoukro', 'CI'], ['Mali', 'Bamako', 'ML'], ['Burkina Faso', 'Ouagadougou', 'BF'], ['Niger', 'Niamey', 'NE'], ['Benin', 'Porto-Novo', 'BJ'], ['Togo', 'Lomé', 'TG'], ['Cabo Verde', 'Praia', 'CV'], ['Mauritania', 'Nouakchott', 'MR']])
add('Africa', 'East Africa', [['Kenya', 'Nairobi', 'KE'], ['Uganda', 'Kampala', 'UG'], ['Tanzania', 'Dodoma', 'TZ'], ['Ethiopia', 'Addis Ababa', 'ET'], ['Somalia', 'Mogadishu', 'SO'], ['Rwanda', 'Kigali', 'RW'], ['Burundi', 'Gitega', 'BI'], ['South Sudan', 'Juba', 'SS'], ['Djibouti', 'Djibouti', 'DJ'], ['Eritrea', 'Asmara', 'ER'], ['Comoros', 'Moroni', 'KM'], ['Seychelles', 'Victoria', 'SC'], ['Madagascar', 'Antananarivo', 'MG'], ['Mauritius', 'Port Louis', 'MU'], ['Malawi', 'Lilongwe', 'MW'], ['Zambia', 'Lusaka', 'ZM']])
add('Africa', 'North Africa', [['Egypt', 'Cairo', 'EG'], ['Morocco', 'Rabat', 'MA'], ['Algeria', 'Algiers', 'DZ'], ['Tunisia', 'Tunis', 'TN'], ['Libya', 'Tripoli', 'LY'], ['Sudan', 'Khartoum', 'SD']])
add('Africa', 'Central Africa', [['Cameroon', 'Yaoundé', 'CM'], ['Chad', "N'Djamena", 'TD'], ['Central African Republic', 'Bangui', 'CF'], ['Republic of the Congo', 'Brazzaville', 'CG'], ['DR Congo', 'Kinshasa', 'CD'], ['Gabon', 'Libreville', 'GA'], ['Equatorial Guinea', 'Malabo', 'GQ'], ['Sao Tome and Principe', 'São Tomé', 'ST']])
add('Africa', 'Southern Africa', [['South Africa', 'Pretoria', 'ZA'], ['Namibia', 'Windhoek', 'NA'], ['Botswana', 'Gaborone', 'BW'], ['Zimbabwe', 'Harare', 'ZW'], ['Mozambique', 'Maputo', 'MZ'], ['Lesotho', 'Maseru', 'LS'], ['Eswatini', 'Mbabane', 'SZ'], ['Angola', 'Luanda', 'AO']])

add('Asia', 'Middle East', [['Saudi Arabia', 'Riyadh', 'SA'], ['United Arab Emirates', 'Abu Dhabi', 'AE'], ['Qatar', 'Doha', 'QA'], ['Kuwait', 'Kuwait City', 'KW'], ['Bahrain', 'Manama', 'BH'], ['Oman', 'Muscat', 'OM'], ['Yemen', "Sana'a", 'YE'], ['Iraq', 'Baghdad', 'IQ'], ['Iran', 'Tehran', 'IR'], ['Israel', 'Jerusalem', 'IL'], ['Jordan', 'Amman', 'JO'], ['Lebanon', 'Beirut', 'LB'], ['Syria', 'Damascus', 'SY'], ['Palestine', 'Ramallah', 'PS'], ['Turkey', 'Ankara', 'TR'], ['Cyprus', 'Nicosia', 'CY']])
add('Asia', 'South Asia', [['India', 'New Delhi', 'IN'], ['Pakistan', 'Islamabad', 'PK'], ['Bangladesh', 'Dhaka', 'BD'], ['Sri Lanka', 'Sri Jayawardenepura Kotte', 'LK'], ['Nepal', 'Kathmandu', 'NP'], ['Bhutan', 'Thimphu', 'BT'], ['Maldives', 'Malé', 'MV'], ['Afghanistan', 'Kabul', 'AF']])
add('Asia', 'Southeast Asia', [['Indonesia', 'Jakarta', 'ID'], ['Malaysia', 'Kuala Lumpur', 'MY'], ['Thailand', 'Bangkok', 'TH'], ['Vietnam', 'Hanoi', 'VN'], ['Philippines', 'Manila', 'PH'], ['Myanmar', 'Naypyidaw', 'MM'], ['Cambodia', 'Phnom Penh', 'KH'], ['Laos', 'Vientiane', 'LA'], ['Singapore', 'Singapore', 'SG'], ['Brunei', 'Bandar Seri Begawan', 'BN'], ['Timor-Leste', 'Dili', 'TL']])
add('Asia', 'East Asia', [['China', 'Beijing', 'CN'], ['Japan', 'Tokyo', 'JP'], ['South Korea', 'Seoul', 'KR'], ['North Korea', 'Pyongyang', 'KP'], ['Mongolia', 'Ulaanbaatar', 'MN']])
add('Asia', 'Central Asia', [['Kazakhstan', 'Astana', 'KZ'], ['Uzbekistan', 'Tashkent', 'UZ'], ['Turkmenistan', 'Ashgabat', 'TM'], ['Kyrgyzstan', 'Bishkek', 'KG'], ['Tajikistan', 'Dushanbe', 'TJ'], ['Armenia', 'Yerevan', 'AM'], ['Azerbaijan', 'Baku', 'AZ'], ['Georgia', 'Tbilisi', 'GE']])

add('Europe', 'Western Europe', [['France', 'Paris', 'FR'], ['Germany', 'Berlin', 'DE'], ['Netherlands', 'Amsterdam', 'NL'], ['Belgium', 'Brussels', 'BE'], ['Austria', 'Vienna', 'AT'], ['Switzerland', 'Bern', 'CH'], ['Luxembourg', 'Luxembourg', 'LU'], ['Ireland', 'Dublin', 'IE'], ['United Kingdom', 'London', 'GB']])
add('Europe', 'Northern Europe', [['Sweden', 'Stockholm', 'SE'], ['Norway', 'Oslo', 'NO'], ['Denmark', 'Copenhagen', 'DK'], ['Finland', 'Helsinki', 'FI'], ['Iceland', 'Reykjavík', 'IS'], ['Estonia', 'Tallinn', 'EE'], ['Latvia', 'Riga', 'LV'], ['Lithuania', 'Vilnius', 'LT']])
add('Europe', 'Southern Europe', [['Italy', 'Rome', 'IT'], ['Spain', 'Madrid', 'ES'], ['Portugal', 'Lisbon', 'PT'], ['Greece', 'Athens', 'GR'], ['Croatia', 'Zagreb', 'HR'], ['Slovenia', 'Ljubljana', 'SI'], ['Malta', 'Valletta', 'MT'], ['Albania', 'Tirana', 'AL'], ['North Macedonia', 'Skopje', 'MK'], ['Bosnia and Herzegovina', 'Sarajevo', 'BA'], ['Montenegro', 'Podgorica', 'ME'], ['Serbia', 'Belgrade', 'RS'], ['Kosovo', 'Pristina', 'XK']])
add('Europe', 'Eastern Europe', [['Poland', 'Warsaw', 'PL'], ['Czechia', 'Prague', 'CZ'], ['Slovakia', 'Bratislava', 'SK'], ['Hungary', 'Budapest', 'HU'], ['Romania', 'Bucharest', 'RO'], ['Bulgaria', 'Sofia', 'BG'], ['Ukraine', 'Kyiv', 'UA'], ['Belarus', 'Minsk', 'BY'], ['Moldova', 'Chisinau', 'MD'], ['Russia', 'Moscow', 'RU']])
add('Europe', 'Microstates', [['Monaco', 'Monaco', 'MC'], ['San Marino', 'San Marino', 'SM'], ['Vatican City', 'Vatican City', 'VA'], ['Liechtenstein', 'Vaduz', 'LI']])

add('North America', 'North America', [['Canada', 'Ottawa', 'CA'], ['United States', 'Washington, D.C.', 'US'], ['Mexico', 'Mexico City', 'MX']])
add('North America', 'Central America', [['Belize', 'Belmopan', 'BZ'], ['Guatemala', 'Guatemala City', 'GT'], ['Honduras', 'Tegucigalpa', 'HN'], ['El Salvador', 'San Salvador', 'SV'], ['Nicaragua', 'Managua', 'NI'], ['Costa Rica', 'San José', 'CR'], ['Panama', 'Panama City', 'PA']])
add('North America', 'Caribbean', [['Cuba', 'Havana', 'CU'], ['Jamaica', 'Kingston', 'JM'], ['Haiti', 'Port-au-Prince', 'HT'], ['Dominican Republic', 'Santo Domingo', 'DO'], ['Bahamas', 'Nassau', 'BS'], ['Barbados', 'Bridgetown', 'BB'], ['Trinidad and Tobago', 'Port of Spain', 'TT'], ['Saint Lucia', 'Castries', 'LC'], ['Grenada', "St. George's", 'GD'], ['Saint Vincent and the Grenadines', 'Kingstown', 'VC'], ['Antigua and Barbuda', "St. John's", 'AG'], ['Dominica', 'Roseau', 'DM'], ['Saint Kitts and Nevis', 'Basseterre', 'KN']])

add('South America', 'South America', [['Brazil', 'Brasília', 'BR'], ['Argentina', 'Buenos Aires', 'AR'], ['Chile', 'Santiago', 'CL'], ['Peru', 'Lima', 'PE'], ['Colombia', 'Bogotá', 'CO'], ['Venezuela', 'Caracas', 'VE'], ['Ecuador', 'Quito', 'EC'], ['Bolivia', 'Sucre', 'BO'], ['Paraguay', 'Asunción', 'PY'], ['Uruguay', 'Montevideo', 'UY'], ['Guyana', 'Georgetown', 'GY'], ['Suriname', 'Paramaribo', 'SR']])

add('Oceania', 'Oceania', [['Australia', 'Canberra', 'AU'], ['New Zealand', 'Wellington', 'NZ'], ['Papua New Guinea', 'Port Moresby', 'PG'], ['Fiji', 'Suva', 'FJ'], ['Solomon Islands', 'Honiara', 'SB'], ['Vanuatu', 'Port Vila', 'VU'], ['Samoa', 'Apia', 'WS'], ['Kiribati', 'Tarawa', 'KI'], ['Tonga', "Nuku'alofa", 'TO'], ['Micronesia', 'Palikir', 'FM'], ['Palau', 'Ngerulmud', 'PW'], ['Marshall Islands', 'Majuro', 'MH'], ['Nauru', 'Yaren', 'NR'], ['Tuvalu', 'Funafuti', 'TV']])

export const COUNTRIES = countries
