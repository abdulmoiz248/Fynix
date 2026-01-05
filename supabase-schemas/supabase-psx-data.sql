-- Insert PSX (Pakistan Stock Exchange) listed companies
-- Major companies across different sectors as of 2026

INSERT INTO psx_stocks (symbol, company_name, sector, current_price) VALUES
-- Oil & Gas
('OGDC', 'Oil & Gas Development Company Limited', 'Oil & Gas', 95.50),
('PPL', 'Pakistan Petroleum Limited', 'Oil & Gas', 78.20),
('PSO', 'Pakistan State Oil Company Limited', 'Oil & Gas', 185.40),
('APL', 'Attock Petroleum Limited', 'Oil & Gas', 310.50),
('MARI', 'Mari Petroleum Company Limited', 'Oil & Gas', 1850.00),

-- Banks
('HBL', 'Habib Bank Limited', 'Banking', 145.30),
('UBL', 'United Bank Limited', 'Banking', 175.80),
('MCB', 'MCB Bank Limited', 'Banking', 220.50),
('BAFL', 'Bank Alfalah Limited', 'Banking', 42.50),
('NBP', 'National Bank of Pakistan', 'Banking', 35.20),
('ABL', 'Allied Bank Limited', 'Banking', 68.40),
('MEBL', 'Meezan Bank Limited', 'Banking', 115.60),
('BAHL', 'Bank AL Habib Limited', 'Banking', 72.30),

-- Cement
('LUCK', 'Lucky Cement Limited', 'Cement', 620.00),
('DGKC', 'D.G. Khan Cement Company Limited', 'Cement', 85.50),
('MLCF', 'Maple Leaf Cement Factory Limited', 'Cement', 32.40),
('PIOC', 'Pioneer Cement Limited', 'Cement', 65.20),
('CHCC', 'Cherat Cement Company Limited', 'Cement', 125.30),

-- Fertilizer
('FFC', 'Fauji Fertilizer Company Limited', 'Fertilizer', 95.80),
('EFERT', 'Engro Fertilizers Limited', 'Fertilizer', 78.50),
('FATIMA', 'Fatima Fertilizer Company Limited', 'Fertilizer', 32.60),

-- Textiles
('GADT', 'Gul Ahmed Textile Mills Limited', 'Textiles', 28.50),
('NISHAT', 'Nishat Mills Limited', 'Textiles', 85.20),
('AZGN', 'Azgard Nine Limited', 'Textiles', 12.40),

-- Technology & Communication
('TRG', 'TRG Pakistan Limited', 'Technology', 125.60),
('SYS', 'Systems Limited', 'Technology', 145.80),
('AVN', 'Avanceon Limited', 'Technology', 98.20),
('NETSOL', 'NetSol Technologies Limited', 'Technology', 72.50),
('PTC', 'Pakistan Telecommunication Company Limited', 'Telecom', 8.50),

-- Automobile
('INDU', 'Indus Motor Company Limited', 'Automobile', 1450.00),
('PSMC', 'Pak Suzuki Motor Company Limited', 'Automobile', 285.50),
('HCAR', 'Honda Atlas Cars (Pakistan) Limited', 'Automobile', 325.40),
('MTL', 'Millat Tractors Limited', 'Automobile', 1250.00),

-- Food & Personal Care
('NESTLE', 'Nestle Pakistan Limited', 'Food', 6800.00),
('ENGRO', 'Engro Corporation Limited', 'Chemicals', 285.50),
('COLG', 'Colgate Palmolive (Pakistan) Limited', 'Personal Care', 2450.00),
('UNITY', 'Unity Foods Limited', 'Food', 28.30),

-- Pharmaceuticals
('HINOON', 'Highnoon Laboratories Limited', 'Pharma', 625.00),
('SEARL', 'The Searle Company Limited', 'Pharma', 185.50),
('AGP', 'AGP Limited', 'Pharma', 98.20),

-- Power
('HUBC', 'Hub Power Company Limited', 'Power', 72.50),
('KEL', 'K-Electric Limited', 'Power', 4.85),

-- Steel & Engineering
('ASTL', 'Amreli Steels Limited', 'Steel', 45.30),
('ISL', 'International Steels Limited', 'Steel', 68.50),
('AGTL', 'AGT Limited', 'Engineering', 125.40),

-- Chemical
('ICI', 'ICI Pakistan Limited', 'Chemical', 825.50),
('EPCL', 'Engro Polymer & Chemicals Limited', 'Chemical', 48.60),

-- Paper & Board
('PKGP', 'Packages Limited', 'Paper & Board', 485.50),
('CHERAT', 'Cherat Packaging Limited', 'Paper & Board', 185.30),

-- Insurance
('EFUG', 'EFU General Insurance Limited', 'Insurance', 285.50),
('EFULI', 'EFU Life Assurance Limited', 'Insurance', 198.40),
('SNGP', 'Sui Northern Gas Pipelines Limited', 'Gas', 52.30),
('SSGC', 'Sui Southern Gas Company Limited', 'Gas', 18.50),

-- Tobacco
('PAKT', 'Pakistan Tobacco Company Limited', 'Tobacco', 785.50),

-- Miscellaneous
('KAPCO', 'Kot Addu Power Company Limited', 'Power', 35.20),
('POL', 'Pakistan Oilfields Limited', 'Oil & Gas', 425.50),
('AIRLINK', 'Airlink Communication Limited', 'Technology', 98.50),
('WTL', 'Worldcall Telecom Limited', 'Telecom', 2.15),
('PACE', 'Pace (Pakistan) Limited', 'Textiles', 5.80),
('FCCL', 'Fauji Cement Company Limited', 'Cement', 18.50),
('LOTCHEM', 'Lotte Chemical Pakistan Limited', 'Chemical', 15.60),
('DAWH', 'Dawood Hercules Corporation Limited', 'Chemicals', 125.50);

-- Add more symbols as needed
