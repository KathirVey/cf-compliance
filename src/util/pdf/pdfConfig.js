export const canvasConfig = {
    width: 1000,
    height: 400
}

export const gridConfig = {
    width: 830,
    height: 245,
    startX: 70,
    startY: 20,
    lineWidth: 2,
    lineColor: '#d3d3d3',
    textColor: '#000000',
    midnightNoonColor: '#969292',
    statusChangeColor: '#0063a380',
    pcFillStyleColor: '#ca6a3240',
    pcStrokeStyleColor: '#ca6a32bf',
    ymFillStyleColor: '#b44e2a40',
    ymStrokeStyleColor: '#b44e2abf'
}

export const dutyStatusAbbreviation = {
    Off: 'OFF',
    SleeperBerth: 'SB',
    Driving: 'D',
    On: 'ON'
}

export const specialConditionsAbbreviation = {
    StartPersonalConveyance: 'PC',
    StartYardMove: 'YM',
    Clear: 'PC/YM Cleared'
}

export const eventOrigin = {
    1: 'Automatic',
    2: 'Driver',
    3: 'Other User',
    4: 'Unidentified Driver'
}

export const eventTypes = {
    StatusChange: 'Status Change',
    Login: 'ELD Login', 
    Logout: 'ELD Logout',
    StartOfDay: 'Start of Day',
    Exception: 'Exception',
    IntermediateLog: 'Intermediate Log',
    PcYmChange: 'PC/YM Change',
    LogCertification: 'Certification',
    EnginePowerUp: 'Engine Power Up',
    EnginePowerDown: 'Engine Power Down',
    MalfunctionDetected: 'Malfunction Detected',
    MalfunctionCleared: 'Malfuction Cleared',
    DiagnosticDetected: 'Diagnostic Detected',
    DiagnosticCleared: 'Diagnostic Cleared',
    CycleChanged: `Change in Driver's cycle`,
    OperatingZoneChanged: 'Change in Operating Zone',
    OffDutyDeferral: 'Off Duty Deferral',
    AdditionalWorkHours: 'Additional Work Hours',
    Remark: 'Remark',
    HosRuleSetModifier: 'Hos ruleset modifier'
}

export const isoLocationMapping = {
    'CA-AB': {usAbbreviation: 'AB', canadaAbbreviation: 'AB'},
    'CA-BC': {usAbbreviation: 'BC', canadaAbbreviation: 'BC'},
    'CA-MB': {usAbbreviation: 'MB', canadaAbbreviation: 'MB'},
    'CA-NB': {usAbbreviation: 'NB', canadaAbbreviation: 'NB'},
    'CA-NL': {usAbbreviation: 'NF', canadaAbbreviation: 'NL'},
    'CA-NS': {usAbbreviation: 'NS', canadaAbbreviation: 'NS'},
    'CA-ON': {usAbbreviation: 'ON', canadaAbbreviation: 'ON'},
    'CA-PE': {usAbbreviation: 'PE', canadaAbbreviation: 'PE'},
    'CA-QC': {usAbbreviation: 'QC', canadaAbbreviation: 'QC'},
    'CA-SK': {usAbbreviation: 'SK', canadaAbbreviation: 'SK'},
    'CA-NT': {usAbbreviation: 'NT', canadaAbbreviation: 'NT'},
    'CA-NU': {usAbbreviation: 'OT', canadaAbbreviation: 'NU'},
    'CA-YT': {usAbbreviation: 'YT', canadaAbbreviation: 'YT'},

    'MX-AGU': {usAbbreviation: 'AG', canadaAbbreviation: 'AG'},
    'MX-BCN': {usAbbreviation: 'BN', canadaAbbreviation: 'BN'},
    'MX-BCS': {usAbbreviation: 'BS', canadaAbbreviation: 'BS'},
    'MX-CAM': {usAbbreviation: 'CP', canadaAbbreviation: 'CP'},
    'MX-CHH': {usAbbreviation: 'CI', canadaAbbreviation: 'CI'},
    'MX-CHP': {usAbbreviation: 'CS', canadaAbbreviation: 'CS'},
    'MX-COA': {usAbbreviation: 'CH', canadaAbbreviation: 'CH'},
    'MX-COL': {usAbbreviation: 'CL', canadaAbbreviation: 'CL'},
    'MX-CMX': {usAbbreviation: 'DF', canadaAbbreviation: 'DF'},
    'MX-DUR': {usAbbreviation: 'DG', canadaAbbreviation: 'DG'},
    'MX-GRO': {usAbbreviation: 'GE', canadaAbbreviation: 'GE'},
    'MX-GUA': {usAbbreviation: 'GJ', canadaAbbreviation: 'GJ'},
    'MX-HID': {usAbbreviation: 'HD', canadaAbbreviation: 'HD'},
    'MX-JAL': {usAbbreviation: 'JA', canadaAbbreviation: 'JA'},
    'MX-MEX': {usAbbreviation: 'MX', canadaAbbreviation: 'MX'},
    'MX-MIC': {usAbbreviation: 'MC', canadaAbbreviation: 'MC'},
    'MX-MOR': {usAbbreviation: 'MR', canadaAbbreviation: 'MR'},
    'MX-NAY': {usAbbreviation: 'NA', canadaAbbreviation: 'NA'},
    'MX-NLE': {usAbbreviation: 'NL', canadaAbbreviation: 'NL'},
    'MX-OAX': {usAbbreviation: 'OA', canadaAbbreviation: 'OA'},
    'MX-PUE': {usAbbreviation: 'PU', canadaAbbreviation: 'PU'},
    'MX-QUE': {usAbbreviation: 'QE', canadaAbbreviation: 'QE'},
    'MX-ROO': {usAbbreviation: 'QI', canadaAbbreviation: 'QI'},
    'MX-SLP': {usAbbreviation: 'SL', canadaAbbreviation: 'SL'},
    'MX-SIN': {usAbbreviation: 'SI', canadaAbbreviation: 'SI'},
    'MX-SON': {usAbbreviation: 'SO', canadaAbbreviation: 'SO'},
    'MX-TAB': {usAbbreviation: 'TB', canadaAbbreviation: 'TB'},
    'MX-TAM': {usAbbreviation: 'TA', canadaAbbreviation: 'TA'},
    'MX-TLA': {usAbbreviation: 'TL', canadaAbbreviation: 'TL'},
    'MX-VER': {usAbbreviation: 'VC', canadaAbbreviation: 'VC'},
    'MX-YUC': {usAbbreviation: 'YU', canadaAbbreviation: 'YU'},
    'MX-ZAC': {usAbbreviation: 'ZA', canadaAbbreviation: 'ZA'},
    
    'US-AK': {usAbbreviation: 'AK', canadaAbbreviation: 'AK'},
    'US-AL': {usAbbreviation: 'AL', canadaAbbreviation: 'AL'},
    'US-AR': {usAbbreviation: 'AR', canadaAbbreviation: 'AR'},
    'US-AS': {usAbbreviation: 'AS', canadaAbbreviation: 'AS'},
    'US-AZ': {usAbbreviation: 'AZ', canadaAbbreviation: 'AZ'},
    'US-CA': {usAbbreviation: 'CA', canadaAbbreviation: 'CA'},
    'US-CO': {usAbbreviation: 'CO', canadaAbbreviation: 'CO'},
    'US-CT': {usAbbreviation: 'CT', canadaAbbreviation: 'CT'},
    'US-DC': {usAbbreviation: 'DC', canadaAbbreviation: 'DC'},
    'US-DE': {usAbbreviation: 'DE', canadaAbbreviation: 'DE'},
    'US-FL': {usAbbreviation: 'FL', canadaAbbreviation: 'FL'},
    'US-GA': {usAbbreviation: 'GA', canadaAbbreviation: 'GA'},
    'US-GU': {usAbbreviation: 'GU', canadaAbbreviation: 'GU'},
    'US-HI': {usAbbreviation: 'HI', canadaAbbreviation: 'HI'},
    'US-IA': {usAbbreviation: 'IA', canadaAbbreviation: 'IA'},
    'US-ID': {usAbbreviation: 'ID', canadaAbbreviation: 'ID'},
    'US-IL': {usAbbreviation: 'IL', canadaAbbreviation: 'IL'},
    'US-IN': {usAbbreviation: 'IN', canadaAbbreviation: 'IN'},
    'US-KS': {usAbbreviation: 'KS', canadaAbbreviation: 'KS'},
    'US-KY': {usAbbreviation: 'KY', canadaAbbreviation: 'KY'},
    'US-LA': {usAbbreviation: 'LA', canadaAbbreviation: 'LA'},
    'US-MA': {usAbbreviation: 'MA', canadaAbbreviation: 'MA'},
    'US-MD': {usAbbreviation: 'MD', canadaAbbreviation: 'MD'},
    'US-ME': {usAbbreviation: 'ME', canadaAbbreviation: 'ME'},
    'US-MI': {usAbbreviation: 'MI', canadaAbbreviation: 'MI'},
    'US-MN': {usAbbreviation: 'MN', canadaAbbreviation: 'MN'},
    'US-MO': {usAbbreviation: 'MO', canadaAbbreviation: 'MO'},
    'US-MP': {usAbbreviation: 'MP', canadaAbbreviation: 'MP'},
    'US-MS': {usAbbreviation: 'MS', canadaAbbreviation: 'MS'},
    'US-MT': {usAbbreviation: 'MT', canadaAbbreviation: 'MT'},
    'US-NC': {usAbbreviation: 'NC', canadaAbbreviation: 'NC'},
    'US-ND': {usAbbreviation: 'ND', canadaAbbreviation: 'ND'},
    'US-NE': {usAbbreviation: 'NE', canadaAbbreviation: 'NE'},
    'US-NH': {usAbbreviation: 'NH', canadaAbbreviation: 'NH'},
    'US-NJ': {usAbbreviation: 'NJ', canadaAbbreviation: 'NJ'},
    'US-NM': {usAbbreviation: 'NM', canadaAbbreviation: 'NM'},
    'US-NV': {usAbbreviation: 'NV', canadaAbbreviation: 'NV'},
    'US-NY': {usAbbreviation: 'NY', canadaAbbreviation: 'NY'},
    'US-OH': {usAbbreviation: 'OH', canadaAbbreviation: 'OH'},
    'US-OK': {usAbbreviation: 'OK', canadaAbbreviation: 'OK'},
    'US-OR': {usAbbreviation: 'OR', canadaAbbreviation: 'OR'},
    'US-PA': {usAbbreviation: 'PA', canadaAbbreviation: 'PA'},
    'US-PR': {usAbbreviation: 'PR', canadaAbbreviation: 'PR'},
    'US-RI': {usAbbreviation: 'RI', canadaAbbreviation: 'RI'},
    'US-SC': {usAbbreviation: 'SC', canadaAbbreviation: 'SC'},
    'US-SD': {usAbbreviation: 'SD', canadaAbbreviation: 'SD'},
    'US-TN': {usAbbreviation: 'TN', canadaAbbreviation: 'TN'},
    'US-TX': {usAbbreviation: 'TX', canadaAbbreviation: 'TX'},
    'US-UM': {usAbbreviation: 'OT', canadaAbbreviation: 'OT'},
    'US-UT': {usAbbreviation: 'UT', canadaAbbreviation: 'UT'},
    'US-VA': {usAbbreviation: 'VA', canadaAbbreviation: 'VA'},
    'US-VI': {usAbbreviation: 'VI', canadaAbbreviation: 'VI'},
    'US-VT': {usAbbreviation: 'VT', canadaAbbreviation: 'VT'},
    'US-WA': {usAbbreviation: 'WA', canadaAbbreviation: 'WA'},
    'US-WV': {usAbbreviation: 'WV', canadaAbbreviation: 'WV'},
    'US-WI': {usAbbreviation: 'WI', canadaAbbreviation: 'WI'},
    'US-WY': {usAbbreviation: 'WY', canadaAbbreviation: 'WY'}
}
