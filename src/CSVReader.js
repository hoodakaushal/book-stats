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
        this.setState({ books: data })
        console.log(this.books);
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
        var resp = await fetch("https://api.genderize.io?name=".concat(encodeURI(author.split(" ")[0])))
        var data = await resp.json()
        console.log(data)
        var gender = await data["gender"]
        return [author, gender]
    }

    async fetchGenders() {
        if (this.state.books) {
            var authors = Array.from(new Set(this.state.books.map(book => book.data["Author"])))
            var authorGenders = new Map();
            var promises = []
            for (var i = 0; i < authors.length; i++) {
                promises.push(this.fetchGender(authors[i])
                )
            }

            var result = await Promise.all(promises)
            result.forEach(res => {
                authorGenders.set(res[0], res[1] || "unknown")
            })
            console.log(authors);
            console.log(authorGenders);
            console.log(result)
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
        counts.set("total", this.state.books.length)

        this.state.books.forEach((book) => {
            var gender = this.state.genders.get(book.data["Author"])
            counts.set(gender, (counts.get(gender) || 0) + 1);
        });


        console.log([...counts])
        return [...counts].map((genderCount, index) => {
            return (
                <tr key={index}>
                    <td>{genderCount[0]}</td>
                    <td>{genderCount[1]}</td>
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
                        preview: 10
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
                                <td>Count</td></tr>
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