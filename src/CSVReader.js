import React, { Component } from 'react';
import { CSVReader } from 'react-papaparse';
import { Alert, Button, Table } from 'react-bootstrap';


import 'bootstrap/dist/css/bootstrap.min.css';


export default class CSVReader2 extends Component {
    state = {
        books: []
    }

    handleOnDrop = (data) => {
        console.log('---------------------------');
        var books = []
        data.forEach((book) => {
            if (book.data["Exclusive Shelf"] == "read") {
                books.push(book)
            }
        })
        this.setState({ books: books })
        console.log(data);
        console.log('---------------------------');
    };

    handleOnError = (err, file, inputElem, reason) => {
        console.log(err);
    };

    handleOnRemoveFile = (data) => {

        console.log('---------------------------');
        console.log(data);
        console.log('---------------------------');
        this.setState({
            books: []
        })

    };

    getBookCount() {
        return this.state.books.length
    }

    getAuthorCount() {
        return Array.from(new Set(this.state.books.map(book => book.data["Author"]))).length
    }

    async fetchGender(author) {
        //https://book-stats-backend.herokuapp.com/author/gender?name=
        //http://localhost:5000/author/gender?name=
        var resp = await fetch("https://book-stats-backend.herokuapp.com/author/gender?name=".concat(encodeURI(author)))
        var data = await resp.json()
        console.log(data)
        var gender = await data["gender"]
        return [author, gender]
    }

    async fetchAllGenders(authors) {
        // https://book-stats-backend.herokuapp.com/author/gender-bulk
        // http://localhost:5000/author/gender-bulk
        var resp = await fetch("https://book-stats-backend.herokuapp.com/author/gender-bulk", {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
              },
            body: JSON.stringify(authors)
          })
        var data = await resp.json()
        console.log(data)
        var authorsMap = new Map(Object.entries(data))
        return new Map(Array.from(authorsMap, ([k, v]) => ([k, v[0] || "unknown"])))
    }

    async fetchGenders() {
        if (this.state.books) {
            var authors = Array.from(new Set(this.state.books.map(book => book.data["Author"])))
            var authorGenders = await this.fetchAllGenders(authors)
            console.log(authors);
            console.log(authorGenders);
            // console.log(result)
            this.setState({ genders: authorGenders })
        } else {
            alert("Load books first");
        }
    }

    renderBooksData = () => {
        if (this.state.books == null || this.state.genders == null) {
            return <tr></tr>
        }

        var counts = new Map();
        var authors = this.getAuthorCount();
        counts.set("total", [this.state.books.length, 100, authors, 100])
        var visited = new Set()

        this.state.books.forEach((book) => {
            var gender = this.state.genders.get(book.data["Author"])
            var value = (counts.has(gender) ? counts.get(gender) : [0, 0, 0, 0])
            value[0] = value[0] + 1
            value[1] = value[0] * 100 / this.state.books.length
            if (!visited.has(book.data["Author"])) {
                visited.add(book.data["Author"])
                value[2] = value[2] + 1
                value[3] = value[2] * 100 / authors
            }
            counts.set(gender, value)
        });


        console.log([...counts])
        return [...counts].map((genderCount, index) => {
            return (
                <tr key={index}>
                    <td>{genderCount[0]}</td>
                    <td>{genderCount[1][0]}</td>
                    <td>{Math.round(genderCount[1][1])}</td>
                    <td>{genderCount[1][2]}</td>
                    <td>{Math.round(genderCount[1][3])}</td>
                </tr>

            )
        })
    }

    render() {
        return (

            <>
                <h3>Step 1: Import Goodreads Data</h3>
                <Alert variant="info">
                    See {' '}
                    <Alert.Link href="https://help.goodreads.com/s/article/How-do-I-import-or-export-my-books-1553870934590">here</Alert.Link> for how to export data as CSV from Goodreads.
                </Alert>
                <CSVReader
                    onDrop={this.handleOnDrop}
                    onError={this.handleOnError}
                    addRemoveButton
                    onRemoveFile={this.handleOnRemoveFile}
                    config={{
                        header: true,
                        skipEmptyLines: 'greedy',
                        preview: 10000
                    }}
                >
                    <span>Drop exported Goodreads CSV file here or click to upload.</span>
                </CSVReader>
                <div>
                    <p>No. of books: {this.getBookCount()}</p>
                    <p>No. of authors: {this.getAuthorCount()}</p>
                </div>
                <Button onClick={async () => { await this.fetchGenders(); }}><h5>Step 2: Do the thing!</h5></Button>
                <div>
                    <h3 id='title'>No. of books read by author gender</h3>
                    <Table
                        variant="default"
                        style={{}}
                        striped
                        bordered
                    // responsive
                    >
                        <thead>
                            <tr><td>Gender</td>
                                <td>Books(total)</td>
                                <td>Books(percent)</td>
                                <td>Authors(total)</td>
                                <td>Authors(percent)</td>
                                </tr>
                        </thead>
                        <tbody>
                            {this.renderBooksData()}
                        </tbody>
                    </Table>
                </div>
            </>
        );
    }
}