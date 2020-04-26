import { NextPage } from "next";
import styles from "../styles/index.module.css";
import { useEffect, useState } from "react";
import LineChart, { TimeSeries } from "../components/LineChart";
import BarChart, { BarChartData } from "../components/BarChart";
import dynamic from "next/dynamic";
import { Col, Row } from "react-bootstrap";
import Layout from "../components/Layout";
import file from "../public/custom.geo.json";
import CountryCard from "../components/CountryCard";
import { schemeYlOrRd, schemeDark2 } from "d3";
import useSWR, { responseInterface } from "swr";
import axios from "axios";
import GlobalStats from "../components/GlobalStats";
import Header from "../components/Header";
import { ColorScheme } from "../components/WorldMap";

const WorldMap = dynamic(() => import("../components/WorldMap"), {
    ssr: false,
});

const roundingFn = (x, n) => {
    return (x * 100).toFixed(n);
};

const baseUrl = "https://corona.lmao.ninja/";
const allCountriesFetcher = (...args: any) =>
    axios.get(args).then((res) => {
        const countryData: any[] = res.data;
        const tempData: any[] = [];
        countryData.forEach((d: any) => {
            file.features.forEach((f) => {
                const { sovereignt, pop_est, gdp_md_est } = f.properties;

                if (d.country === sovereignt) {
                    let extendedProps = {
                        ...d,
                        sovereignt,
                        pop_est,
                        gdp_md_est,
                    };
                    tempData.push({ ...f, properties: extendedProps });
                    return;
                }
            });
        });
        return tempData;
    });

const timeSeriesFetcher = (...args: any) =>
    axios.get(args).then((res) => {
        const hc: any = res.data;
        const timelines = Object.keys(hc.timeline);

        const data: TimeSeries[] = [];

        //3 timelines - active, deaths, recovered
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

        const datesOfCases = Object.keys(hc.timeline.cases);
        for (let i = 1; i < datesOfCases.length; i++) {
            const today = parseInt(hc.timeline.cases[datesOfCases[i]]);
            const yesterday = parseInt(hc.timeline.cases[datesOfCases[i - 1]]);
            const lastDay = parseInt(
                hc.timeline.cases[datesOfCases[datesOfCases.length - 1]]
            );

            data.push({
                country: hc.country,
                category: "todayCases",
                date: Date.parse(datesOfCases[i]),
                value: parseFloat(roundingFn((today - yesterday) / lastDay, 2)),
                supporting: today - yesterday,
            });
        }
        return data;
    });

const globalStatsFetcher = (...args: any) =>
    axios.get(args).then((res) => {
        const closedCases = res.data.recovered + res.data.deaths;
        return {y
            ["World Cases"]: res.data.cases,
            ["World Active"]: `${res.data.active}(${roundingFn(
                res.data.active / res.data.cases,
                2
            )}%)`,
            ["World Closed"]: `${res.data.cases - res.data.active}(${roundingFn(
                (res.data.cases - res.data.active) / res.data.cases,
                2
            )}%)`,
            ["World Deaths"]: `${res.data.deaths}(${roundingFn(
                res.data.deaths / closedCases,
                2
            )}%)`,
            ["World Recovered"]: `${res.data.recovered}(${roundingFn(
                res.data.recovered / closedCases,
                2
            )}%)`,
            ["Today Cases"]: `${res.data.todayCases}(${roundingFn(
                res.data.todayCases / res.data.cases,
                2
            )}%)`,
            ["Today Deaths"]: `${res.data.todayDeaths}(${roundingFn(
                res.data.todayDeaths / res.data.deaths,
                2
            )}%)`,
            ["Affected countries"]: res.data.affectedCountries,
            updated: res.data.updated,
        };
    });

export interface HomeProps {}

const Home: NextPage<HomeProps> = () => {
    const [country, setCountry] = useState<string>(null);
    const [top5Cases, setTop5Cases] = useState<any[] | undefined>([]);
    const [top5CasesToday, setTop5CasesToday] = useState<any[] | undefined>([]);
    const [filteredOverview, setFilteredOverview] = useState<any | undefined>(
        undefined
    );

    const allCountries: responseInterface<any, any> = useSWR(
        `${baseUrl}v2/countries`,
        allCountriesFetcher
    );
    const timeSeriesRes: responseInterface<any, any> = useSWR(
        () => (country ? `${baseUrl}v2/historical/${country}` : null),
        timeSeriesFetcher
    );
    const globalStats: responseInterface<any, any> = useSWR(
        `${baseUrl}v2/all`,
        globalStatsFetcher
    );

    useEffect(() => {
        if (allCountries.data) {
            const data: any[] = allCountries.data;

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

            setTop5Cases(
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

            setTop5CasesToday(
                barChartData
                    .map((d) => {
                        const { todayCases, cases } = d.props;
                        return {
                            label: d.label,
                            props: {
                                ["new cases %"]: roundingFn(
                                    todayCases / cases,
                                    2
                                ),
                            },
                        };
                    })
                    .sort(
                        (a, b) =>
                            parseFloat(b.props["new cases %"]) -
                            parseFloat(a.props["new cases %"])
                    )
                    .slice(0, 5)
            );
        }
    }, [allCountries.data]);

    const handleCountrySelection = (selection: string) => {
        if (selection) {
            setCountry(selection);
            const filtered = allCountries.data.filter(
                (d) => d.properties.sovereignt === selection
            );

            setFilteredOverview(filtered[0]);
        }
    };

    const casesData = timeSeriesRes.data && [
        ...timeSeriesRes.data.filter((d) => d.category === "cases"),
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

    const deathsData = timeSeriesRes.data && [
        ...timeSeriesRes.data.filter((d) => d.category === "deaths"),
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

    const recData = timeSeriesRes.data && [
        ...timeSeriesRes.data.filter((d) => d.category === "recovered"),
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

    const todayCases = timeSeriesRes.data && [
        ...timeSeriesRes.data.filter((d) => d.category === "todayCases"),
    ];
    const newCases = (
        <LineChart
            id="new-cases"
            key="new-cases"
            width={450}
            height={350}
            strokeColor="#cc9902"
            dotColor="#cc9902"
            strokeWidth={2}
            scaleColor="#fff"
            labelX="Timeline"
            labelY="New cases %"
            tooltipLabel="Abs:"
            data={todayCases}
        />
    );

    const { updated, ...gs } = globalStats.data
        ? globalStats.data
        : { updated: 0 };
    const closedCases =
        filteredOverview &&
        filteredOverview.properties.deaths +
            filteredOverview.properties.recovered;
    const mapColorScheme: ColorScheme[] = [
        {
            value: 100,
            color: "#3FFF5F",
        },
        {
            value: 1000,
            color: "#76B041",
        },
        {
            value: 5000,
            color: "#F3B700",
        },
        {
            value: 10000,
            color: "#f38a00",
        },
        {
            value: 100000,
            color: "#FF3F3F",
        },
        {
            value: 300000,
            color: "#8C0909",
        },
    ];

    return (
        <>
            <Header lastUpdate={updated} />
            <main>
                <Layout>
                    <Row>
                        <Col md={12}>
                            <GlobalStats
                                data={gs}
                                colorScheme={[
                                    "#cc9902",
                                    "#cc9902",
                                    "#cc9902",
                                    "#CE0A0A",
                                    "#2FBC46",
                                    "#cc9902",
                                    "#cc9902",
                                    "#cc9902",
                                ]}
                            />
                        </Col>
                    </Row>
                    <Row>
                        <Col md lg={8} className={[styles.colMargin].join(" ")}>
                            <WorldMap
                                height={100}
                                geoData={allCountries.data}
                                selectedCountry={handleCountrySelection}
                                colorScheme={mapColorScheme}
                            />
                            <BarChart
                                id="top5"
                                chartTitle="Top 5 by total cases"
                                data={top5Cases}
                                colorScheme={schemeYlOrRd}
                                verticalOrientation
                            />
                            <BarChart
                                id="bot5"
                                chartTitle="Top 5 by daily growth of cases in %"
                                data={top5CasesToday}
                                colorScheme={[schemeDark2]}
                                verticalOrientation={false}
                            />
                        </Col>
                        <Col md lg={4} className={styles.colMargin}>
                            {filteredOverview && (
                                <CountryCard
                                    title={filteredOverview.properties.country}
                                    population={
                                        filteredOverview.properties.pop_est
                                    }
                                    gdp={filteredOverview.properties.gdp_md_est}
                                    data={{
                                        cases: {
                                            abs:
                                                filteredOverview.properties
                                                    .cases,
                                            rel: roundingFn(
                                                filteredOverview.properties
                                                    .cases /
                                                    filteredOverview.properties
                                                        .pop_est,
                                                2
                                            ),
                                        },
                                        active: {
                                            abs:
                                                filteredOverview.properties
                                                    .active,
                                            rel: roundingFn(
                                                filteredOverview.properties
                                                    .active /
                                                    filteredOverview.properties
                                                        .cases,
                                                2
                                            ),
                                        },
                                        deaths: {
                                            abs:
                                                filteredOverview.properties
                                                    .deaths,
                                            rel: roundingFn(
                                                filteredOverview.properties
                                                    .deaths / closedCases,
                                                2
                                            ),
                                        },
                                        recovered: {
                                            abs:
                                                filteredOverview.properties
                                                    .recovered,
                                            rel: roundingFn(
                                                filteredOverview.properties
                                                    .recovered / closedCases,
                                                2
                                            ),
                                        },
                                        critical: {
                                            abs:
                                                filteredOverview.properties
                                                    .critical,
                                            rel: roundingFn(
                                                filteredOverview.properties
                                                    .critical /
                                                    filteredOverview.properties
                                                        .active,
                                                2
                                            ),
                                        },
                                        ["cases today"]: {
                                            abs:
                                                filteredOverview.properties
                                                    .todayCases,
                                            rel: roundingFn(
                                                filteredOverview.properties
                                                    .todayCases /
                                                    filteredOverview.properties
                                                        .cases,
                                                2
                                            ),
                                        },
                                        // tested: filteredOverview.tests,
                                        // ["tests per million"]:
                                        //     filteredOverview.testsPerOneMillion,
                                    }}
                                    image={
                                        filteredOverview.properties.countryInfo
                                            .flag
                                    }
                                    components={[
                                        cases,
                                        deaths,
                                        recovered,
                                        newCases,
                                    ]}
                                />
                            )}
                        </Col>
                    </Row>
                </Layout>
            </main>
        </>
    );
};

export default Home;
