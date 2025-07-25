-- Insert sample equipment data
INSERT INTO equipment_master (tag_no, equipment_name, equipment_type, location, installation_date) VALUES
('BO.3161.04.M1', 'Induration Fan Motor', 'Motor', 'Induration Area', '2020-01-15'),
('BO.3161.05.M1', 'Cooling Fan Motor', 'Motor', 'Cooling Area', '2020-02-10'),
('BO.3161.06.M1', 'Exhaust Fan Motor', 'Motor', 'Exhaust Area', '2020-03-05'),
('BO.3162.01.P1', 'Main Process Pump', 'Pump', 'Process Area', '2019-12-20'),
('BO.3163.02.C1', 'Air Compressor', 'Compressor', 'Utility Area', '2021-05-12'),
('BO.3164.01.G1', 'Emergency Generator', 'Generator', 'Power House', '2019-08-30'),
('BO.3165.01.F1', 'Induced Draft Fan', 'Fan', 'Stack Area', '2020-06-18'),
('BO.3166.01.M2', 'Pellet Screen Motor', 'Motor', 'Pellet Plant', '2021-01-25'),
('BO.3167.01.P2', 'Water Circulation Pump', 'Pump', 'Cooling Tower', '2020-09-14'),
('BO.3168.01.C2', 'Instrument Air Compressor', 'Compressor', 'Utility Building', '2021-03-08')
ON CONFLICT (tag_no) DO NOTHING;
