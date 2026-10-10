/**
 * Learn: short pages on the practice and its techniques, in plain words.
 * Two swipeable decks: the basics (always open) and the techniques
 * (unlocked progressively by the program step). Revisit anytime.
 */
import { useCallback, useRef, useState, type ReactNode } from 'react';
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { fonts, radii, spacing, useTheme } from '../theme';
import { Badge, Card, Screen, ScreenTitle, SectionLabel } from '../components/ui';
import { BackdropBloom } from '../components/BackdropBloom';
import { Bloom, GrainOverlay } from '../components/Bloom';
import { OrnamentDivider } from '../components/OrnamentDivider';
import {
  TECHNIQUES,
  isTechniqueUnlocked,
  type Technique,
} from '../data/techniques';
import { buildKumbhakaPreset } from '../data/presets';
import { loadSettings } from '../storage/stats';

const BASICS: { title: string; body: string }[] = [
  {
    title: 'Your breath travels',
    body: 'An old text measured the exhale at 12 finger-widths. The less breath you spend, the more stays with you.',
  },
  {
    title: 'What actually changes',
    body: 'Calmer evenings in the first weeks. A slower resting breath by week six to eight. Steadier speech. The old powers are tradition, not promises.',
  },
  {
    title: 'How the program works',
    body: 'One session a day. The app sets the pace: 7 sessions per step, slower each step. New techniques unlock as you go.',
  },
];

const KIND_LABEL: Record<Technique['kind'], string> = {
  foundation: 'Foundation',
  cue: 'Cue',
  session: 'Guided session',
  instructional: 'Ritual',
};

function pageWidth(): number {
  return Dimensions.get('window').width - spacing.md * 2;
}

function PagedDeck({ children }: { children: ReactNode[] }) {
  const { colors } = useTheme();
  const [page, setPage] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const width = pageWidth();
  const count = children.length;

  const goTo = (next: number) => {
    const clamped = Math.max(0, Math.min(count - 1, next));
    setPage(clamped);
    scrollRef.current?.scrollTo({ x: clamped * width, animated: true });
  };

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / width);
    setPage(Math.max(0, Math.min(count - 1, next)));
  };

  return (
    <View>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
      >
        {children.map((child, i) => (
          <View key={i} style={{ width }}>
            {child}
          </View>
        ))}
      </ScrollView>
      <View style={styles.indicatorRow}>
        <Pressable
          onPress={() => goTo(page - 1)}
          disabled={page === 0}
          hitSlop={8}
          style={styles.arrowBtn}
          accessibilityLabel="Previous page"
        >
          <Text style={[styles.arrowText, { color: colors.ember, opacity: page === 0 ? 0.25 : 1 }]}>
            ‹
          </Text>
        </Pressable>
        <Text style={[styles.indicatorNumeral, { color: colors.ember }]}>
          {page + 1} / {count}
        </Text>
        <View style={[styles.indicatorTrack, { backgroundColor: colors.hairline }]}>
          <View
            style={[
              styles.indicatorFill,
              { backgroundColor: colors.ember, width: `${((page + 1) / count) * 100}%` }
            ]}
          />
        </View>
        <Pressable
          onPress={() => goTo(page + 1)}
          disabled={page === count - 1}
          hitSlop={8}
          style={styles.arrowBtn}
          accessibilityLabel="Next page"
        >
          <Text style={[styles.arrowText, { color: colors.ember, opacity: page === count - 1 ? 0.25 : 1 }]}>
            ›
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function BasicsPage({ title, body }: { title: string; body: string }) {
  const { colors } = useTheme();
  return (
    <Card style={styles.pageCard}>
      <Text style={[styles.pageTitle, { color: colors.bone }]}>{title}</Text>
      <Text style={[styles.pageBody, { color: colors.ash }]}>{body}</Text>
    </Card>
  );
}

function PhaseBar() {
  const { colors } = useTheme();
  const preset = buildKumbhakaPreset(8);
  const labelFor = (key: string) =>
    key === 'inhale' ? 'In' : key === 'holdIn' ? 'Hold' : 'Out';
  return (
    <View style={styles.phaseBarWrap}>
      <View style={styles.phaseBarRow}>
        {preset.phases.map((p) => (
          <View
            key={p.key}
            style={[
              styles.phaseSeg,
              {
                flex: p.seconds,
                backgroundColor: p.key === 'holdIn' ? colors.emberDim : colors.surfaceSubtle,
                borderColor: p.key === 'holdIn' ? colors.ember : colors.hairline,
              },
            ]}
          >
            <Text
              style={[styles.phaseSegText, { color: p.key === 'holdIn' ? colors.ember : colors.ash }]}
            >
              {labelFor(p.key)} {Math.round(p.seconds)}s
            </Text>
          </View>
        ))}
      </View>
      <Text style={[styles.phaseBarCaption, { color: colors.ashMuted }]}>
        One kumbhaka breath at the Step 4 pace
      </Text>
    </View>
  );
}

function LockedTechniquePage({ technique }: { technique: Technique }) {
  const { colors } = useTheme();
  return (
    <Card style={styles.pageCard}>
      <View style={styles.lockedBloomWrap} pointerEvents="none">
        <Bloom
          size={120}
          phaseKey="exhale"
          phaseSeconds={1}
          phaseToken={0}
          status="idle"
          frozen
        />
      </View>
      <Text style={[styles.pageTitle, { color: colors.bone }]}>{technique.name}</Text>
      {technique.sanskrit ? (
        <Text style={[styles.pageSanskrit, { color: colors.ash }]}>{technique.sanskrit}</Text>
      ) : null}
      <Text style={[styles.pageBody, { color: colors.ash }]}>{technique.tagline}</Text>
      <View style={styles.lockBadgeWrap}>
        <Badge label={`Unlocks at Step ${technique.unlockStep + 1}`} variant="coral" />
      </View>
    </Card>
  );
}

function UnlockedTechniquePage({ technique }: { technique: Technique }) {
  const { colors } = useTheme();
  return (
    <Card style={styles.pageCard}>
      <View style={styles.kindRow}>
        <Badge label={KIND_LABEL[technique.kind]} variant="default" />
      </View>
      <Text style={[styles.pageTitle, { color: colors.bone }]}>{technique.name}</Text>
      {technique.sanskrit ? (
        <Text style={[styles.pageSanskrit, { color: colors.ember }]}>{technique.sanskrit}</Text>
      ) : null}
      {technique.what.map((line) => (
        <Text key={line} style={[styles.pageBody, { color: colors.ash }]}>
          {line}
        </Text>
      ))}
      <View style={styles.stepsList}>
        {technique.steps.map((step, i) => (
          <View key={step} style={styles.stepRow}>
            <Text style={[styles.stepNum, { color: colors.ember }]}>{i + 1}</Text>
            <Text style={[styles.stepText, { color: colors.bone }]}>{step}</Text>
          </View>
        ))}
      </View>
      {technique.id === 'kumbhaka' ? <PhaseBar /> : null}
      <Text style={[styles.whenLine, { color: colors.ashMuted }]}>{technique.when}</Text>
      {technique.safety ? (
        <View style={[styles.safetyBox, { borderColor: colors.danger }]}>
          <Text style={[styles.safetyText, { color: colors.bone }]}>{technique.safety}</Text>
        </View>
      ) : null}
    </Card>
  );
}

export function LearnScreen() {
  const { colors } = useTheme();
  const [step, setStep] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      loadSettings().then((s) => {
        if (alive) setStep(s.programStep ?? 0);
      });
      return () => {
        alive = false;
      };
    }, []),
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.ink }]}>
      <BackdropBloom size={520} offsetY={0} />
      <GrainOverlay />

      <Screen noPaddingBottom>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <ScreenTitle subtitle="Short pages on the practice and its techniques">
            Learn
          </ScreenTitle>

          <View style={styles.sectionWrap}>
            <SectionLabel gold>The basics</SectionLabel>
            <PagedDeck>
              {BASICS.map((b) => (
                <BasicsPage key={b.title} title={b.title} body={b.body} />
              ))}
            </PagedDeck>
          </View>

          <OrnamentDivider />

          <View style={styles.sectionWrap}>
            <SectionLabel gold>Techniques</SectionLabel>
            <Text style={[styles.deckSub, { color: colors.ash }]}>
              New practices unlock as your program advances. Locked pages show what is coming.
            </Text>
            <PagedDeck>
              {TECHNIQUES.map((t) =>
                isTechniqueUnlocked(t, step) ? (
                  <UnlockedTechniquePage key={t.id} technique={t} />
                ) : (
                  <LockedTechniquePage key={t.id} technique={t} />
                ),
              )}
            </PagedDeck>
          </View>
        </ScrollView>
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  sectionWrap: {
    marginTop: spacing.md,
  },
  deckSub: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  pageCard: {
    padding: spacing.md,
    marginRight: spacing.sm,
    minHeight: 220,
  },
  pageTitle: {
    fontFamily: fonts.serifSemi,
    fontSize: 22,
    letterSpacing: -0.2,
  },
  pageSanskrit: {
    fontSize: 14,
    marginTop: 2,
  },
  pageBody: {
    fontSize: 14,
    lineHeight: 21,
    marginTop: spacing.xs,
  },
  kindRow: {
    marginBottom: spacing.xs,
  },
  stepsList: {
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  stepNum: {
    fontFamily: fonts.serifSemi,
    fontSize: 15,
    minWidth: 16,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  whenLine: {
    fontSize: 12,
    marginTop: spacing.sm,
    lineHeight: 17,
  },
  safetyBox: {
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.sm,
    marginTop: spacing.sm,
  },
  safetyText: {
    fontSize: 13,
    lineHeight: 19,
  },
  lockBadgeWrap: {
    marginTop: spacing.md,
  },
  lockedBloomWrap: {
    position: 'absolute',
    right: 4,
    top: 4,
    opacity: 0.25,
  },
  phaseBarWrap: {
    marginTop: spacing.md,
  },
  phaseBarRow: {
    flexDirection: 'row',
    gap: 4,
  },
  phaseSeg: {
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingVertical: 8,
    alignItems: 'center',
  },
  phaseSegText: {
    fontSize: 11,
    fontWeight: '700',
  },
  phaseBarCaption: {
    fontSize: 11,
    marginTop: 6,
  },
  indicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
    paddingRight: spacing.sm,
  },
  indicatorNumeral: {
    fontFamily: fonts.serifSemi,
    fontSize: 14,
    minWidth: 44,
    textAlign: 'center',
  },
  arrowBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  arrowText: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 26,
  },
  indicatorTrack: {
    flex: 1,
    height: 2,
    borderRadius: 1,
    overflow: 'hidden',
  },
  indicatorFill: {
    height: '100%',
  },
});
