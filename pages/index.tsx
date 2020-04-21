import Head from "next/head";
import { NextPage } from "next";
import styles from "../styles/index.module.css";
import { useEffect, useState } from "react";
import LineChart, { TimeSeries } from "../components/LineChart";
import BarChart, { BarChartProps, BarChartData } from "../components/BarChart";
import dynamic from "next/dynamic";
import { Col } from "react-bootstrap";
import Layout from "../components/Layout";
import { NovelCovid, Country, HistoricalCountry } from "novelcovid";
import file from "../public/custom.geo.json";
import CountryCard from "../components/CountryCard";
import { schemeYlOrRd, schemeOrRd, schemeDark2, schemeGreys } from "d3";
import Header from "../components/Header";
import useSWR, { responseInterface } from 'swr'

const WorldMap = dynamic(() => import("../components/WorldMap"), {
    ssr: false,
});

const fetcher = (...args: any) => fetch(args).then(res => res.json());
const baseUrl = "https://corona.lmao.ninja/"

export interface HomeProps {}

const Home: NextPage<HomeProps> = () => {
    const [geoData, setGeoData] = useState<any[] | undefined>([]);
    const [top5, setTop5] = useState<any[] | undefined>([]);
    const [bot5, setBot5] = useState<any[] | undefined>([]);
    // const timeSeriesRes: responseInterface<any, any> = useSWR(`${baseUrl}v2/countries/Germany?yesterday=true`, fetcher);
    const [timeSeries, setTimeSeries] = useState<TimeSeries[] | undefined>([]);
    const [filteredOverview, setFilteredOverview] = useState<
        Country | undefined
    >(undefined);
    const track = new NovelCovid();

    const roundingFn = (x, n) => {
        return (x * 100).toFixed(n);
    }

    useEffect(() => {
        const data: any[] = [];
        track.countries().then((d: Country) => {
            const keys = Object.keys(d);
            keys.forEach((k) => {
                file.features.forEach((f) => {
                    if (d[k].country === f.properties.sovereignt) {
                        let extendedProps = Object.assign(
                            {},
                            {
                                cases: d[k].cases,
                                recovered: d[k].recovered,
                                deaths: d[k].deaths,
                                active: d[k].active,
                                todayCases: d[k].todayCases,
                                tests: d[k].tests,
                                testsPerOneMillion: d[k].testsPerOneMillion,
                                countryFlag: d[k].countryInfo.flag,
                                sovereignt: f.properties.sovereignt,
                                pop_est: f.properties.pop_est,
                                gdp_md_est: f.properties.gdp_md_est,
                            }
                        );
                        data.push({ ...f, properties: extendedProps });
                        return;
                    }
                });
            });
            setGeoData(data);

            const labels = new Set(data.map((d) => d.properties.sovereignt));

            const barChartData: BarChartData[] = [];
            data.sort(
                (a, b) => b.properties.cases - a.properties.cases
            ).forEach((d) => {
                if (labels.has(d.properties.sovereignt)) {
                    const { sovereignt, ...props } = d.properties;
                    labels.delete(d.properties.sovereignt);
                    barChartData.push({
                        label: sovereignt,
                        props: props,
                    });
                }
            });

            setTop5(
                barChartData
                    .map((d) => {
                        const { active, recovered, deaths } = d.props;
                        return {
                            label: d.label,
                            props: { active, recovered, deaths },
                        };
                    })
                    .slice(0, 5)
            );

            setBot5(
                barChartData
                    .map((d) => {
                        const { testsPerOneMillion } = d.props;
                        return {
                            label: d.label,
                            props: {
                                ["tests per million ppl"]: testsPerOneMillion,
                            },
                        };
                    })
                    .sort(
                        (a, b) =>
                            b.props["tests per million ppl"] -
                            a.props["tests per million ppl"]
                    )
                    .slice(0, 5)
            );
        });
    }, []);

    const handleCountrySelection = (selection: string) => {
        if (selection) {
            track.historical(null, selection).then((hc: HistoricalCountry) => {
                const timelines = Object.keys(hc.timeline);

                const data: TimeSeries[] = [];

                timelines.forEach((c) => {
                    const dates = Object.keys(hc.timeline[c]);
                    dates.forEach((date) => {
                        data.push({
                            country: hc.country,
                            category: c,
                            date: Date.parse(date),
                            value: hc.timeline[c][date],
                        });
                    });
                });
                setTimeSeries(data);
            });

            track
                .countries(selection)
                .then((d: Country) => setFilteredOverview(d));
        }
    };


    const casesData = timeSeries && [
        ...timeSeries.filter((d) => d.category === "cases"),
    ];
    const cases = (
        <LineChart
            id="cases"
            key="cases"
            width={450}
            height={350}
            strokeColor="#F3B700"
            dotColor="#cc9902"
            strokeWidth={2}
            scaleColor="#fff"
            labelX="Timeline"
            labelY="Confirmed Cases"
            data={casesData}
        />
    );

    const deathsData = timeSeries && [
        ...timeSeries.filter((d) => d.category === "deaths"),
    ];
    const deaths = (
        <LineChart
            id="deaths"
            key="deaths"
            width={450}
            height={350}
            strokeColor="#FF3F3F"
            dotColor="#CE0A0A"
            strokeWidth={2}
            scaleColor="#fff"
            labelX="Timeline"
            labelY="Deaths"
            data={deathsData}
        />
    );

    const recData = timeSeries && [
        ...timeSeries.filter((d) => d.category === "recovered"),
    ];
    const recovered = (
        <LineChart
            id="recovered"
            key="recovered"
            width={450}
            height={350}
            strokeColor="#2FBC46"
            dotColor="#3FFF5F"
            strokeWidth={2}
            scaleColor="#fff"
            labelX="Timeline"
            labelY="Recovered"
            data={recData}
        />
    );

    return (
        <div>
            <Head>
                <title>COVID-19 Dash</title>
                <link rel="icon" href="/favicon.ico" />
                <link
                    href="https://api.mapbox.com/mapbox-gl-js/v1.9.0/mapbox-gl.css"
                    rel="stylesheet"
                />
                <link
                    rel="stylesheet"
                    href="https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-geocoder/v4.4.2/mapbox-gl-geocoder.css"
                    type="text/css"
                />
                <link
                    href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,300;0,500;0,700;1,400&display=swap"
                    rel="stylesheet"
                />
            </Head>
            <Header />
            <main>
                <Layout>
                    <Col md lg={8} className={[styles.colMargin].join(" ")}>
                        <WorldMap
                            height={100}
                            geoData={geoData}
                            selectedCountry={handleCountrySelection}
                        />
                        <BarChart
                            id="top5"
                            chartTitle="Top 5 by total cases"
                            data={top5}
                            colorScheme={schemeYlOrRd}
                            verticalOrientation
                        />
                        <BarChart
                            id="bot5"
                            chartTitle="Top 5 by testing per million people"
                            data={bot5}
                            colorScheme={[schemeDark2]}
                            verticalOrientation={false}
                        />
                    </Col>
                    <Col md lg={4} className={styles.colMargin}>
                        {filteredOverview && (
                            <CountryCard
                                title={filteredOverview.country}
                                updated={filteredOverview.updated}
                                data={{
                                    cases: {
                                        abs: filteredOverview.cases,
                                        rel: 100
                                    },
                                    active: {
                                        abs: filteredOverview.active,
                                        rel: roundingFn(filteredOverview.active/filteredOverview.cases, 2)
                                    },
                                    deaths: {
                                        abs: filteredOverview.deaths,
                                        rel: roundingFn(filteredOverview.deaths/filteredOverview.cases, 2)
                                    },
                                    recovered: {
                                        abs: filteredOverview.recovered,
                                        rel: roundingFn(filteredOverview.recovered/filteredOverview.cases, 2)
                                    },
                                    critical: {
                                        abs: filteredOverview.critical,
                                        rel: roundingFn(filteredOverview.critical/filteredOverview.cases, 2)
                                    },
                                    ["cases today"]: {
                                        abs: filteredOverview.todayCases,
                                        rel: roundingFn(filteredOverview.todayCases/filteredOverview.cases, 2)
                                    },
                                    // tested: filteredOverview.tests,
                                    // ["tests per million"]:
                                    //     filteredOverview.testsPerOneMillion,
                                }}
                                image={filteredOverview.countryInfo.flag}
                                components={[cases, deaths, recovered]}
                            />
                        )}
                    </Col>
                </Layout>
            </main>
        </div>
    );
};

export default Home;
