import React, { Component } from 'react';
import { parseString } from 'xml2js';

import { containerStyle } from './styles';
import DepartureCard from "./components/DepartureCard";

// ["soap:Envelope"]["soap:Body"]["0"].GetDepartureArrivalResponse["0"].GetDepartureArrivalResult["0"].Lines["0"].Line["0"]
const BUS_STOP_ID = "83241";
const SKANETRAFIKEN_URL = `/.netlify/functions/departures?stop=${BUS_STOP_ID}`;

const ONE_SECOND = 1000 /* milliseconds */;
const FRAMES_PER_SECOND = 60;

function extractLinesFromXml(result) {
  return result["soap:Envelope"]["soap:Body"][0].GetDepartureArrivalResponse[0].GetDepartureArrivalResult[0].Lines[0].Line;
}

function extractDeparturesForLine(lines, wantedLine) {
  return lines.filter((line) => line.No[0] === wantedLine).map((line) => line.JourneyDateTime[0]);
}

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      departuresPerLine: {},
      currentTime: new Date(),
      fetchError: false,
    };
  }

  componentDidMount() {
    let request = new Request(SKANETRAFIKEN_URL);

    fetch(request).then((response) => {
      return response.blob();
    }).then((blob) => {
      let reader = new FileReader();
      reader.addEventListener("loadend", () => {
        parseString(reader.result, (err, result) => {
          let lines = extractLinesFromXml(result);

          if (typeof lines === "undefined") {
            lines = [];
          }
          let lineNumbers = new Set(lines.map(line => line.No[0]));
          let departuresPerLine = {};
          for (let lineNumber of lineNumbers) {
            departuresPerLine[lineNumber] = extractDeparturesForLine(lines, lineNumber);
          }
          this.setState({ departuresPerLine });
        });
      });
      reader.readAsText(blob, "UTF-8");
    }).catch((error) => {
      this.setState({ fetchError: true });
    });

    this.intervalHandle = setInterval(
      () => (this.setState({ currentTime: new Date() })),
      ONE_SECOND / FRAMES_PER_SECOND
    );
  }

  componentWillUnmount() {
    clearInterval(this.intervalHandle);
  }

  render() {
      let cards = Object.keys(this.state.departuresPerLine).map(line => (
          <DepartureCard
              key={line}
              lineNumber={line}
              departures={this.state.departuresPerLine[line]}
              currentTime={this.state.currentTime}
          />
      ));
      return (
      <div className="container" style={containerStyle}>
        <div className="row">
            <div className="col-sm">
                <h1>Avgångar från Helsingborg C</h1>
            </div>

        </div>
          <div className="row">{cards}</div>
      </div>
    );
  }
}

export default App;
