import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

Font.register({
  family: 'DM Mono',
  src: 'https://fonts.gstatic.com/s/dmmono/v14/aFTR7PB1QTsUX8KYthSQBK4.ttf',
});

const gold   = '#8a6e2f';
const goldDim = '#6b531f';
const cream  = '#f7f6f3';
const dark   = '#1a1916';
const muted  = '#a09c96';

const s = StyleSheet.create({
  page: {
    backgroundColor: cream,
    padding: 0,
    fontFamily: 'Helvetica',
  },

  // top bar
  topBar: {
    backgroundColor: gold,
    height: 6,
  },

  // header area
  header: {
    paddingHorizontal: 52,
    paddingTop: 44,
    paddingBottom: 32,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.08)',
    alignItems: 'center',
  },
  eyebrow: {
    fontSize: 8,
    letterSpacing: 3,
    color: gold,
    textTransform: 'uppercase',
    marginBottom: 8,
    fontFamily: 'Helvetica',
  },
  title: {
    fontSize: 36,
    color: dark,
    letterSpacing: 1,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
  },
  titleAccent: {
    color: gold,
  },
  subtitle: {
    fontSize: 10,
    color: muted,
    letterSpacing: 2,
    fontFamily: 'Helvetica',
  },

  // ornament row
  ornamentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 52,
    gap: 8,
  },
  ornamentLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(138,110,47,0.25)',
  },
  ornamentDiamond: {
    width: 6,
    height: 6,
    backgroundColor: gold,
    transform: 'rotate(45deg)',
  },
  ornamentDot: {
    width: 3,
    height: 3,
    backgroundColor: goldDim,
    borderRadius: 2,
    transform: 'rotate(45deg)',
  },

  // body
  body: {
    paddingHorizontal: 52,
  },
  greeting: {
    fontSize: 11,
    color: muted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontFamily: 'Helvetica',
    marginBottom: 6,
  },
  recipientName: {
    fontSize: 26,
    color: dark,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  bodyText: {
    fontSize: 11,
    color: '#4a4845',
    lineHeight: 1.7,
    fontFamily: 'Helvetica',
    marginBottom: 8,
  },

  // ticket section
  ticketSection: {
    marginTop: 28,
    marginBottom: 8,
  },
  ticketSectionLabel: {
    fontSize: 8,
    letterSpacing: 3,
    color: muted,
    textTransform: 'uppercase',
    fontFamily: 'Helvetica',
    marginBottom: 12,
  },
  ticketGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  ticketChip: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(138,110,47,0.3)',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: '30.5%',
  },
  ticketDot: {
    width: 5,
    height: 5,
    backgroundColor: gold,
    borderRadius: 3,
    transform: 'rotate(45deg)',
  },
  ticketCode: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: dark,
    letterSpacing: 1.5,
  },

  // divider
  divider: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.07)',
    marginVertical: 28,
  },

  // info box
  infoBox: {
    backgroundColor: 'rgba(138,110,47,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(138,110,47,0.18)',
    borderRadius: 8,
    padding: 16,
    marginTop: 4,
    marginBottom: 28,
  },
  infoTitle: {
    fontSize: 8,
    letterSpacing: 2,
    color: gold,
    textTransform: 'uppercase',
    fontFamily: 'Helvetica-Bold',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 10,
    color: '#4a4845',
    lineHeight: 1.6,
    fontFamily: 'Helvetica',
  },

  // footer
  footer: {
    marginTop: 'auto',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.07)',
    paddingHorizontal: 52,
    paddingVertical: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 8,
    color: muted,
    letterSpacing: 1.5,
    fontFamily: 'Helvetica',
  },
  bottomBar: {
    backgroundColor: gold,
    height: 4,
  },
});

function OrnamentRow() {
  return (
    <View style={s.ornamentRow}>
      <View style={s.ornamentLine} />
      <View style={s.ornamentDot} />
      <View style={{ width: 8 }} />
      <View style={s.ornamentDiamond} />
      <View style={{ width: 8 }} />
      <View style={s.ornamentDot} />
      <View style={s.ornamentLine} />
    </View>
  );
}

export default function TicketPDF({ name, codes, date }) {
  const dateStr = date || new Date().toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.topBar} />

        {/* HEADER */}
        <View style={s.header}>
          <Text style={s.eyebrow}>Einladung</Text>
          <Text style={s.title}>Abi<Text style={s.titleAccent}>ball</Text> 2026</Text>
          <Text style={s.subtitle}>Ticket · Verwaltung · Einlass</Text>
        </View>

        <OrnamentRow />

        {/* BODY */}
        <View style={s.body}>
          <Text style={s.greeting}>Persönliche Einladung für</Text>
          <Text style={s.recipientName}>{name}</Text>

          <Text style={s.bodyText}>
            Wir freuen uns, dich herzlich zum Abiball 2026 einzuladen. Dieser Abend wird ein unvergessliches Fest zum Abschluss unserer gemeinsamen Schulzeit — mit Musik, Tanz und Erinnerungen für immer.
          </Text>
          <Text style={s.bodyText}>
            Bitte halte deine Ticket-Codes bereit und zeige sie beim Einlass vor. Jeder Code ist einmalig gültig und personalisiert.
          </Text>

          <View style={s.divider} />

          {/* TICKETS */}
          <View style={s.ticketSection}>
            <Text style={s.ticketSectionLabel}>
              Deine {codes.length === 1 ? 'Eintrittskarte' : `${codes.length} Eintrittskarten`}
            </Text>
            <View style={s.ticketGrid}>
              {codes.map((code, i) => (
                <View key={i} style={s.ticketChip}>
                  <View style={s.ticketDot} />
                  <Text style={s.ticketCode}>{code}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={s.divider} />

          {/* INFO BOX */}
          <View style={s.infoBox}>
            <Text style={s.infoTitle}>Hinweise zum Einlass</Text>
            <Text style={s.infoText}>
              • Jeder Code ist genau einmal verwendbar und wird beim Einlass entwertet.{'\n'}
              • Bitte zeige deinen Code am Einlass vor — digital oder ausgedruckt.{'\n'}
              • Bei Verlust des Codes wende dich bitte rechtzeitig an die Organisation.
            </Text>
          </View>
        </View>

        {/* FOOTER */}
        <View style={s.footer}>
          <Text style={s.footerText}>ABIBALL 2026</Text>
          <Text style={s.footerText}>{dateStr}</Text>
          <Text style={s.footerText}>TICKET-SYSTEM</Text>
        </View>
        <View style={s.bottomBar} />
      </Page>
    </Document>
  );
}
